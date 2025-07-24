import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketService } from './websocket.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Server, Socket } from 'socket.io';

jest.mock('socket.io', () => {
    return {
        Server: jest.fn().mockImplementation(() => ({
            emit: jest.fn(),
        })),
    };
});

const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
};

describe('WebSocketService', () => {
    let webSocketService: WebsocketService<any>;
    let server: Server;
    let logger: Logger;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WebsocketService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
            ],
        }).compile();

        webSocketService = module.get<WebsocketService<any>>(WebsocketService);
        server = webSocketService.server = new Server();
        logger = module.get<Logger>(WINSTON_MODULE_PROVIDER);
    });

    it('should be defined', () => {
        expect(webSocketService).toBeDefined();
    });

    describe('handleConnection', () => {
        it('should log client connection', () => {
            const mockClient = { id: 'client1' } as Socket;
            webSocketService.handleConnection(mockClient);
            expect(logger.log).toHaveBeenCalledWith(
                'info',
                `Client connected: ${mockClient.id}`,
            );
        });
    });

    describe('handleDisconnect', () => {
        it('should log client disconnection and disconnect the client', () => {
            const mockClient = {
                id: 'client1',
                disconnect: jest.fn(),
            } as unknown as Socket;
            webSocketService.handleDisconnect(mockClient);
            expect(logger.log).toHaveBeenCalledWith(
                'info',
                `Client disconnected: ${mockClient.id}`,
            );
            expect(mockClient.disconnect).toHaveBeenCalled();
        });
    });

    describe('sendData', () => {
        it('should send data to the specified event and log it', () => {
            const eventTitle = 'testEvent';
            const data = { message: 'Hello World' };

            webSocketService.sendData(data, eventTitle);

            expect(server.emit).toHaveBeenCalledWith(eventTitle, data);
            expect(logger.log).toHaveBeenCalledWith(
                'info',
                `Sending data to event ${eventTitle}: ${JSON.stringify(data)}`,
            );
        });

        it('should log an error if data sending fails', () => {
            const eventTitle = 'testEvent';
            const data = { message: 'Hello World' };
            const mockError = new Error('Emit failed');

            jest.spyOn(server, 'emit').mockImplementation(() => {
                throw mockError;
            });

            expect(() => webSocketService.sendData(data, eventTitle)).toThrow(
                'Emit failed',
            );
            expect(logger.error).toHaveBeenCalledWith(
                'error',
                `Failed to send data to event ${eventTitle}: ${mockError.message}`,
            );
        });
    });
});
