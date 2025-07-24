import { Inject, Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ErrorHandlingService } from 'src/common/response/errorHandler.service';
import { Logger } from 'winston';
import { Users } from '../users/entities/users.entity';
import { UsersRepository } from '../users/repositories/users.repository';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Status } from './entities/status.entity';
import { StatusRepository } from './repositories/status.repository';
@Injectable()
export class StatusService {
    readonly adminRole: string;
    readonly superAdminRole: string;
    constructor(
        private readonly statusRepository: StatusRepository,
        private readonly errorHandlingService: ErrorHandlingService,
        private readonly configService: ConfigService,
        private readonly usersRepository: UsersRepository,
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
    ) {
        this.adminRole = this.configService
            .get<string>('ADMIN_ROLE')
            .toLowerCase();
        this.superAdminRole = this.configService
            .get<string>('SUPER_ADMIN')
            .toLowerCase();
    }

    async isAdmin(userId: string): Promise<Users> {
        const isUserExist = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });

        if (!isUserExist) {
            this.errorHandlingService.returnErrorOnNotFound(
                `User not found`,
                `User not found`,
            );
        }

        if (
            !(
                isUserExist.role.label === this.superAdminRole ||
                isUserExist.role.label === this.adminRole
            )
        ) {
            this.errorHandlingService.returnErrorOnForbidden(
                `Access denied`,
                `Access denied for role ${isUserExist.role.label}`,
            );
        }
        return isUserExist;
    }

    /**
     * Create a new status
     * @param createStatusDto - The data of the status to create
     * @param userId - The user id
     * @returns Promise<Status> - The created status>
     */
    async create(createStatusDto: CreateStatusDto, userId: string) {
        await this.isAdmin(userId);
        const { name, type } = createStatusDto;

        const status = new Status({
            name,
            type,
        });
        return this.statusRepository.save(status);
    }

    /**
     * Find all status
     * @param userId - The user id
     * @returns Promise<Status[]> - The found status
     */
    async findAll(userId: string, page: number, limit: number, query: string) {
        const statuss = await this.statusRepository.find({});

        let transformData = statuss.map((status) => {
            return {
                id: status.id,
                name: status.name,
                type: status.type,
            };
        });

        if (query) {
            transformData = transformData.filter((data) => {
                const searchTermLower = query.toLowerCase();
                return (
                    (data.name &&
                        data.name.toLowerCase().includes(searchTermLower)) ||
                    (data.type &&
                        data.type.toLowerCase().includes(searchTermLower))
                );
            });
        }

        const paginatedData = transformData.slice(
            (page - 1) * limit,
            page * limit,
        );

        return {
            data: paginatedData,
            total: transformData.length,
            page,
            limit,
        };
    }

    private capitalizeFirstLetter(word: string): string {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    /**
     * Find a status by id
     * @param id - The status id
     * @param userId - The user id
     * @returns Promise<Status> - The found status
     */
    async findOne(id: string) {
        const status = await this.statusRepository.findOne({
            where: { id },
        });

        if (!status) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Status not found`,
                `Status not  found with id ${id}`,
            );
        }

        return {
            id: status.id,
            name: status.name,
            type: status.type,
        };
    }

    /**
     * Update a status
     * @param id - The status id
     * @param updateStatusDto - The data of the status to update
     * @param userId - The user id
     * @returns Promise<Status> - The updated status
     */
    async update(id: string, updateStatusDto: UpdateStatusDto, userId: string) {
        const { name, type } = updateStatusDto;

        await this.isAdmin(userId);

        const status = await this.statusRepository.findOne({
            where: { id },
        });

        if (!status) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Status  not found`,
                `Status not found`,
            );
        }

        return this.statusRepository.update(
            { id: status.id },
            {
                name: name || status.name,
                type: type || status.type,
            },
        );
    }

    /**
     * Remove a status
     * @param id - The status id
     * @param userId - The user id
     * @returns
     */
    async remove(id: string, userId: string) {
        await this.isAdmin(userId);

        const status = await this.statusRepository.findOne({
            where: { id },
            relations: ['owner'],
        });

        if (!status) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Status not found`,
                `Status not found`,
            );
        }

        await this.statusRepository.softDelete({ id });

        return 'Status deleted successfully';
    }
}
