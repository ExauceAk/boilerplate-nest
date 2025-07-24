import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TokenVerify } from '../../common/guards/jwt.strategy';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';

@Injectable()
@WebSocketGateway({ cors: { origin: true } })
export class WebsocketService<T>
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    private readonly logger: Logger;

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
        private readonly tokenVerify: TokenVerify,
        private readonly errorHandlingService: ErrorHandlingService,
    ) {
        this.logger = logger;
    }

    /**
     * Handles a new client connection.
     * Logs the connection event and returns the connected client.
     */
    handleConnection(client: Socket) {
        this.logger.info(`Client connected: ${client.id}`);
        return client;
    }

    /**
     * Handles the disconnection of a client.
     * Logs the disconnection event and disconnects the client.
     */
    handleDisconnect(client: Socket) {
        this.logger.info(`Client disconnected: ${client.id}`);
        return client.disconnect();
    }

    /**
     * Sends data to a specified event.
     * Logs the data a sending process and emits the event with the provided data.
     * Handles any errors that occur during the process and logs them.
     */
    sendData(data: T, eventTitle: string) {
        try {
            this.logger.info(
                `Sending data to event ${eventTitle}: ${JSON.stringify(data)}`,
            );
            return this.server.emit(`${eventTitle}`, data);
        } catch (error) {
            this.logger.error(
                `Failed to send data to event ${eventTitle}: ${error.message}`,
            );
            throw new Error(error);
        }
    }

    /**
     * Sends data to a specified event within a specific room.
     * Logs the data a sending process and emits the event with the provided data to the specified room.
     * Handles any errors that occur during the process and logs them.
     */
    sendDataToRoom(data: T, eventTitle: string, eventRoute: string) {
        try {
            this.logger.info(
                `Sending data in event ${eventTitle}: ${JSON.stringify(data)}`,
            );
            return this.server.of(eventRoute).emit(eventTitle, data);
        } catch (error) {
            this.logger.error(`Failed to send data : ${error.message}`);
            throw new Error(error);
        }
    }

    /**
     * Sends a notification to a specific user within a specified event and namespace.
     * Logs the notification sending a process and iterates through the sockets in the specified namespace.
     * Emits the event with the provided data to the socket associated with the specified user.
     * Handles any errors that occur during the process and logs them.
     */
    async sendingDataToUser(
        userId: string,
        eventTitle: string,
        eventRoute: string,
        action: string,
        data: T,
    ) {
        try {
            this.logger.info(
                `Sending ${action} "${eventTitle}" to user ${userId}: ${JSON.stringify(data)}`,
            );

            const namespace = this.server.of(eventRoute);

            namespace.sockets.forEach((socket) => {
                const user = socket.data.user;

                if (user && user.id === userId) socket.emit(eventTitle, data);
            });
        } catch (error) {
            this.logger.error(`Failed to send ${action}: ${error.message}`);
            throw new Error(error);
        }
    }

    /**
     * Handles a client connection to a specific namespace.
     * Logs the connection event and resolves the room for the client.
     * Join the client to the resolved room if available.
     * Log any errors that occur during the room resolution process and disconnect the client if an error occurs.
     * Listen to the client's disconnection event and log it.
     */
    private handleNamespaceConnection(
        namespace: string,
        client: Socket,
        roomResolver: (client: Socket) => Promise<string | null>,
    ): void {
        this.logger.info(`Client connected to ${namespace}: ${client.id}`);

        roomResolver(client)
            .then((room) => {
                if (room) {
                    client.join(room);
                    this.logger.info(`Client ${client.id} joined room ${room}`);
                }
            })
            .catch((error) => {
                this.logger.error(`Error resolving room: ${error.message}`);
                client.disconnect();
            });

        client.on('disconnect', () => {
            this.logger.info(
                `Client disconnected from ${namespace}: ${client.id}`,
            );
        });
    }

    /**
     * Extracts and verifies a token from a WebSocket client's handshake headers or query parameters.
     * Logs the token extraction and verification process.
     * Returns the decoded token if valid, otherwise handles errors and logs them.
     */
    private async extractAndVerifyToken(client: Socket): Promise<any> {
        try {
            const token =
                client.handshake.headers['authorization'] ||
                client.handshake.query.token;

            if (!token)
                this.errorHandlingService.returnErrorOnBadRequest(
                    `Token has to be provided when trying to extract token from websocket of the client: ${client}`,
                    `Token is missing`,
                );

            let cleanToken: string;

            if (typeof token === 'string')
                cleanToken = token.startsWith('Bearer ')
                    ? token.split(' ')[1]
                    : token;

            const decoded = await this.tokenVerify.decode(cleanToken);
            if (!decoded)
                this.errorHandlingService.returnErrorOnBadRequest(
                    `Invalid token`,
                    `Invalid token`,
                );

            return decoded;
        } catch (error) {
            this.logger.error(`Token verification failed: ${error.message}`);
            throw new BadRequestException('Token verification failed');
        }
    }

    /**
     * Initializes the module by setting up WebSocket namespaces and their respective room resolvers.
     * Defines namespaces for different functionalities such as verifying numbers, badge counts,
     * and sending messages in conversations.
     * Each namespace has a resolver function
     * that determines the room a client should join based on query parameters or token verification.
     * Logs connection and disconnection events, and handles errors during the room resolution process.
     */
    onModuleInit() {
        const namespaces = [
            {
                name: '/verifyNumber',
                resolver: (client: Socket) =>
                    Promise.resolve(
                        client.handshake.query.qrCodeId
                            ? `user-${client.handshake.query.qrCodeId}`
                            : null,
                    ),
            },
            {
                name: '/notifications/badge-count',
                resolver: async (client: Socket) => {
                    try {
                        const decoded =
                            await this.extractAndVerifyToken(client);
                        const userId = decoded['id'];

                        const user = await this.tokenVerify.getUserById(userId);

                        if (!user)
                            this.errorHandlingService.returnErrorOnNotFound(
                                `User not found`,
                                `Invalid user ID in token`,
                            );

                        client.data.user = user;

                        return `notifications-general-room`;
                    } catch (error) {
                        this.logger.error(
                            `Failed to resolve room for /notifications/badge-count: ${error.message}`,
                        );
                        return null;
                    }
                },
            },
            {
                name: '/activityLogs',
                resolver: async (client: Socket) => {
                    try {
                        const decoded =
                            await this.extractAndVerifyToken(client);
                        const userId = decoded['id'];

                        const user = await this.tokenVerify.getUserById(userId);

                        if (!user)
                            this.errorHandlingService.returnErrorOnNotFound(
                                `User not found`,
                                `Invalid user ID in token`,
                            );

                        client.data.user = user;

                        return `activityLogs-room`;
                    } catch (error) {
                        this.logger.error(
                            `Failed to resolve room for /activityLogs-room: ${error.message}`,
                        );
                        return null;
                    }
                },
            },
            {
                name: '/events',
                resolver: async (client: Socket) => {
                    try {
                        const decoded =
                            await this.extractAndVerifyToken(client);
                        const userId = decoded['id'];

                        const user = await this.tokenVerify.getUserById(userId);

                        if (!user)
                            this.errorHandlingService.returnErrorOnNotFound(
                                `User not found`,
                                `Invalid user ID in token`,
                            );

                        client.data.user = user;

                        return `events-room`;
                    } catch (error) {
                        this.logger.error(
                            `Failed to resolve room for /events-room: ${error.message}`,
                        );
                        return null;
                    }
                },
            },
        ];

        namespaces.forEach((ns) => {
            const namespace = this.server.of(ns.name);
            namespace.on('connection', (client: Socket) => {
                this.handleNamespaceConnection(ns.name, client, ns.resolver);
            });
        });
    }
}
