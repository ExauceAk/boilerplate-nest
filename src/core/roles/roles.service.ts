import {
    ConflictException,
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RolesRepository } from './roles.repository';
import { Roles } from './entities/roles.entity';
import { UsersRepository } from '../users/repositories/users.repository';
import { Users } from '../users/entities/users.entity';
import { CreateRole } from './dtos/create_role.dto';
import { UpdateRoleDto } from './dtos/update_role.dto';
import { ConfigService } from '@nestjs/config';
import { Not } from 'typeorm';

@Injectable()
export class RolesService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        private readonly configService: ConfigService,
        private readonly roleRepository: RolesRepository,
        private readonly usersRepository: UsersRepository,
    ) {}

    /**
     * Verify if a user exit and has the required role
     * @param id - The ID of the user to verify
     * @returns Promise<Users> - The user object if the user exists and has the specified role
     */
    async verifyUserRole(id: string): Promise<Users> {
        this.logger.log('info', `Verifying user role for user ID: ${id}`);

        const isUserExist = await this.usersRepository.findOne({
            where: { id, deleted: false },
        });

        if (!isUserExist) {
            this.logger.log('warn', `User not found or deleted for ID: ${id}`);
            throw new NotFoundException('User not found');
        }

        if (
            isUserExist.role &&
            isUserExist.role.label !==
                this.configService.get<string>('SUPER_ADMIN').toLowerCase()
        ) {
            this.logger.log(
                'warn',
                `Unauthorized role access for user ID: ${id} with role label: ${isUserExist.role.label}`,
            );
            throw new ForbiddenException(
                `You're not authorized to perform this action`,
            );
        }
        return isUserExist;
    }

    /**
     * Retrieve all roles from the database
     * @returns Promise<Roles[]> - An array of role objects
     */
    async findAllRoles(): Promise<Roles[]> {
        this.logger.log('info', 'Fetching all roles');
        return await this.roleRepository.find({
            where: { deleted: false },
            select: ['id', 'label'],
        });
    }

    /**
     * Retrieve a role by criteria
     * @param {Object} criteria - The criteria to find the role
     * @returns {Promise<Roles>} Promise object represents the role entity
     */
    async retrieveRoleByCriteria(criteria: {
        key: string;
        value: string;
    }): Promise<Roles> {
        const { key, value } = criteria;
        this.logger.log('info', `Finding role by ${key}: ${value}`);
        const isRoleExist = await this.roleRepository.findOne({
            where: { [key]: value.trim(), deleted: false },
        });
        if (!isRoleExist) {
            this.logger.log('error', `Role not found with ${key}: ${value}`);
            throw new NotFoundException('Role not found');
        }
        return isRoleExist;
    }

    /**
     * Retrieve a role by its ID
     * @param userId - The ID of the user requesting the role
     * @param id - The ID of the role to retrieve
     * @returns Promise<Roles> - The role object
     */
    async findRoleById(userId: string, id: string): Promise<Roles> {
        this.logger.log('info', `Searching for role with ID: ${id}`);
        await this.verifyUserRole(userId);
        return await this.retrieveRoleByCriteria({ key: 'id', value: id });
    }

    /**
     * Retrieve a role by its label
     * @param userId - The ID of the user requesting the role
     * @param label - The label of the role to retrieve
     * @returns Promise<Roles> - The role object
     */
    async findRoleByLabel(userId: string, label: string): Promise<Roles> {
        this.logger.log('info', `Searching for role with label: ${label}`);
        await this.verifyUserRole(userId);
        return await this.retrieveRoleByCriteria({
            key: 'label',
            value: label,
        });
    }

    /**
     * Create a new role
     * @param userId
     * @param createRole - The data for the new role
     * @returns Promise<Roles> - The created role object
     */
    async createRole(
        userId: string,
        createRole: CreateRole,
    ): Promise<Partial<Roles>> {
        this.logger.log(
            'info',
            `Creating role with data: ${JSON.stringify(createRole)}`,
        );
        await this.verifyUserRole(userId);
        const newLabel = createRole.label.trim();

        const isRoleExist = await this.roleRepository.findOne({
            where: { label: newLabel, deleted: false },
        });

        if (isRoleExist) {
            this.logger.log(
                'warn',
                `Role with label ${newLabel} already exists`,
            );
            throw new ConflictException(`Role already exists`);
        }

        const appRole = new Roles(createRole);
        const createdRole = await this.roleRepository.create(appRole);
        return {
            id: createdRole.id,
            label: createdRole.label,
        };
    }

    /**
     * Update an existing role
     * @param userId - The ID of the user updating the role
     * @param id - The ID of the role to update
     * @param updateRole - The updated data for the role
     * @returns Promise<Roles> - The updated role object
     */
    async updateRole(
        userId: string,
        id: string,
        updateRole: UpdateRoleDto,
    ): Promise<Partial<Roles>> {
        this.logger.log(
            'info',
            `Updating role with ID: ${id} and data: ${JSON.stringify(updateRole)}`,
        );
        const { label } = updateRole;
        const isRoleExist = await this.findRoleById(userId, id);

        if (label) {
            const newLabel = label.trim();
            const isLabelUsed = await this.roleRepository.findOne({
                where: {
                    id: Not(isRoleExist.id),
                    label: newLabel,
                    deleted: false,
                },
            });
            if (isLabelUsed) {
                this.logger.log(
                    'error',
                    `Role already exist with this label: ${newLabel}`,
                );
                throw new ConflictException('Role already exist');
            }
            updateRole.label = newLabel;
        }

        const updatedRole = await this.roleRepository.update(
            { id },
            updateRole,
        );
        return {
            id: updatedRole.id,
            label: updatedRole.label,
        };
    }

    /**
     * Delete a role by its ID
     * @param userId
     * @param id - The ID of the role to delete
     * @returns Promise<string> - A success message
     */
    async deleteRole(userId: string, id: string): Promise<object> {
        this.logger.log('info', `Deleting role with ID: ${id}`);
        await this.findRoleById(userId, id);
        await this.roleRepository.delete({ id });
        this.logger.log('info', `Role with ID ${id} deleted successfully`);
        return { message: `Role deleted successfully` };
    }
}
