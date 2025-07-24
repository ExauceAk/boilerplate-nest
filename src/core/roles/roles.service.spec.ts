import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { Roles } from './entities/roles.entity';
import { Users } from '../users/entities/users.entity';
import { CreateRole } from './dtos/create_role.dto';
import { UpdateRoleDto } from './dtos/update_role.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

describe('RolesService', () => {
    let service: RolesService;
    let rolesRepository: RolesRepository;
    let usersRepository: UsersRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RolesService,
                {
                    provide: RolesRepository,
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: UsersRepository,
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: {
                        log: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<RolesService>(RolesService);
        rolesRepository = module.get<RolesRepository>(RolesRepository);
        usersRepository = module.get<UsersRepository>(UsersRepository);
        module.get<Logger>(WINSTON_MODULE_PROVIDER);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('verifyUserRole', () => {
        it('should verify user role successfully', async () => {
            const user: Users = new Users({
                id: '1',
                role: new Roles({ label: 'super_admin' }),
            });
            jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);

            const result = await service.verifyUserRole('1', 'super_admin');
            expect(result).toBe(user);
        });

        it('should throw an exception if user is not found', async () => {
            jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

            await expect(
                service.verifyUserRole('1', 'super_admin'),
            ).rejects.toThrow(
                new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED),
            );
        });

        it('should throw an exception if user role does not match', async () => {
            const user: Users = new Users({
                id: '1',
                role: new Roles({ label: 'admin' }),
            });
            jest.spyOn(usersRepository, 'findOne').mockResolvedValue(user);

            await expect(
                service.verifyUserRole('1', 'super_admin'),
            ).rejects.toThrow(
                new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED),
            );
        });
    });

    describe('findAllRoles', () => {
        it('should return an array of roles', async () => {
            const result: Roles[] = [];
            jest.spyOn(rolesRepository, 'find').mockResolvedValue(result);

            expect(await service.findAllRoles()).toBe(result);
        });
    });

    describe('findRoleById', () => {
        it('should return a role', async () => {
            const result: Roles = new Roles({
                id: '1',
                label: 'admin',
            });
            jest.spyOn(rolesRepository, 'findOne').mockResolvedValue(result);

            expect(await service.findRoleById('1')).toBe(result);
        });

        it('should throw an exception if the role is not found', async () => {
            jest.spyOn(rolesRepository, 'findOne').mockResolvedValue(null);

            await expect(service.findRoleById('1')).rejects.toThrow(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
        });
    });

    describe('findRoleByLabel', () => {
        it('should return a role', async () => {
            const result: Roles = new Roles({
                id: '1',
                label: 'admin',
            });
            jest.spyOn(rolesRepository, 'findOne').mockResolvedValue(result);

            expect(await service.findRoleByLabel('admin')).toBe(result);
        });

        it('should throw an exception if the role is not found', async () => {
            jest.spyOn(rolesRepository, 'findOne').mockResolvedValue(null);

            await expect(service.findRoleByLabel('admin')).rejects.toThrow(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
        });
    });

    describe('createRole', () => {
        it('should create a role', async () => {
            const createRoleDto: CreateRole = {
                label: 'new Role',
            };
            const result: Roles = new Roles({
                id: '1',
                label: createRoleDto.label,
            });
            jest.spyOn(rolesRepository, 'findOne').mockResolvedValue(null);
            jest.spyOn(rolesRepository, 'create').mockResolvedValue(result);

            const createdRole = await service.createRole(createRoleDto);
            expect(createdRole).toEqual({
                id: result.id,
                label: result.label,
            });
        });

        it('should throw an exception if the role already exists', async () => {
            const createRoleDto: CreateRole = {
                label: 'admin',
            };
            const existingRole: Roles = new Roles({
                id: '1',
                label: 'admin',
            });
            jest.spyOn(rolesRepository, 'findOne').mockResolvedValue(
                existingRole,
            );

            await expect(service.createRole(createRoleDto)).rejects.toThrow(
                new HttpException('Role already exists', HttpStatus.CONFLICT),
            );
        });
    });

    describe('updateRole', () => {
        it('should update a role', async () => {
            const updateRoleDto: UpdateRoleDto = { label: 'admin' };
            const existingRole: Roles = new Roles({
                id: '1',
                label: 'admin',
            });
            const updatedRole: Roles = new Roles({
                id: '1',
                label: 'admin',
            });
            jest.spyOn(rolesRepository, 'findOne').mockResolvedValue(
                existingRole,
            );
            jest.spyOn(rolesRepository, 'update').mockResolvedValue(
                updatedRole,
            );

            const result = await service.updateRole('1', updateRoleDto);
            expect(result).toEqual({
                id: updatedRole.id,
                label: updatedRole.label,
            });
        });

        it('should throw an exception if the role is not found', async () => {
            const updateRoleDto: UpdateRoleDto = { label: 'admin' };
            jest.spyOn(rolesRepository, 'findOne').mockResolvedValue(null);

            await expect(
                service.updateRole('1', updateRoleDto),
            ).rejects.toThrow(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
        });

        it('should throw an exception if the role label already exists', async () => {
            const updateRoleDto: UpdateRoleDto = {
                label: 'new_label',
            };
            const existingRole: Roles = new Roles({
                id: '1',
                label: 'admin',
            });
            const labelExists: Roles = new Roles({
                id: '2',
                label: 'new_label',
            });
            jest.spyOn(rolesRepository, 'findOne')
                .mockResolvedValueOnce(existingRole)
                .mockResolvedValueOnce(labelExists);

            await expect(
                service.updateRole('1', updateRoleDto),
            ).rejects.toThrow(
                new HttpException('Role already exists', HttpStatus.CONFLICT),
            );
        });
    });

    describe('deleteRole', () => {
        it('should delete a role', async () => {
            const existingRole: Roles = new Roles({
                id: '1',
                label: 'admin',
            });
            jest.spyOn(rolesRepository, 'findOne').mockResolvedValue(
                existingRole,
            );
            jest.spyOn(rolesRepository, 'delete').mockResolvedValue(null);

            expect(await service.deleteRole('1')).toBe(
                'Role deleted successfully',
            );
        });

        it('should throw an exception if the role is not found', async () => {
            jest.spyOn(rolesRepository, 'findOne').mockResolvedValue(null);

            await expect(service.deleteRole('1')).rejects.toThrow(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
        });
    });
});
