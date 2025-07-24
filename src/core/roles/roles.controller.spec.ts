import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Roles } from './entities/roles.entity';
import { CreateRole } from './dtos/create_role.dto';
import { UpdateRoleDto } from './dtos/update_role.dto';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { ConfigService } from '@nestjs/config';

describe('RolesController', () => {
    let controller: RolesController;
    let service: RolesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RolesController],
            providers: [
                {
                    provide: RolesService,
                    useValue: {
                        findAllRoles: jest.fn(),
                        findRoleById: jest.fn(),
                        findRoleByLabel: jest.fn(),
                        createRole: jest.fn(),
                        updateRole: jest.fn(),
                        deleteRole: jest.fn(),
                        verifyUserRole: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            if (key === 'SUPER_ADMIN') {
                                return 'super_admin';
                            }
                            return null;
                        }),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: jest.fn(() => true) })
            .compile();

        controller = module.get<RolesController>(RolesController);
        service = module.get<RolesService>(RolesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of roles', async () => {
            const result: Roles[] = [];
            jest.spyOn(service, 'findAllRoles').mockResolvedValue(result);

            expect(await controller.findAll()).toBe(result);
        });
    });

    describe('findOne', () => {
        it('should return a role', async () => {
            const result: Roles = new Roles({
                id: '1',
                label: 'admin',
            });
            jest.spyOn(service, 'findRoleById').mockResolvedValue(result);
            jest.spyOn(service, 'verifyUserRole').mockResolvedValue(null);

            const req = { user: { id: '1' } };
            expect(await controller.findOne('1', req)).toBe(result);
        });

        it('should throw an exception if the role is not found', async () => {
            jest.spyOn(service, 'findRoleById').mockRejectedValue(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
            jest.spyOn(service, 'verifyUserRole').mockResolvedValue(null);

            const req = { user: { id: '1' } };
            await expect(controller.findOne('1', req)).rejects.toThrow(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
        });
    });

    describe('findByLabel', () => {
        it('should return a role', async () => {
            const result: Roles = new Roles({
                id: '1',
                label: 'admin',
            });
            jest.spyOn(service, 'findRoleByLabel').mockResolvedValue(result);
            jest.spyOn(service, 'verifyUserRole').mockResolvedValue(null);

            const req = { user: { id: '1' } };
            expect(await controller.findByLabel('admin', req)).toBe(result);
        });

        it('should throw an exception if the role is not found', async () => {
            jest.spyOn(service, 'findRoleByLabel').mockRejectedValue(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
            jest.spyOn(service, 'verifyUserRole').mockResolvedValue(null);

            const req = { user: { id: '1' } };
            await expect(controller.findByLabel('admin', req)).rejects.toThrow(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
        });
    });

    describe('create', () => {
        it('should create a role', async () => {
            const createRoleDto: CreateRole = {
                label: 'new Role',
            };
            const result: Partial<Roles> = new Roles({
                id: '1',
                label: createRoleDto.label,
            });

            jest.spyOn(service, 'createRole').mockResolvedValue(result);
            jest.spyOn(service, 'verifyUserRole').mockResolvedValue(null);

            const req = { user: { id: '1' } };
            expect(await controller.create(createRoleDto, req)).toBe(result);
        });

        it('should throw an exception if the role already exists', async () => {
            const createRoleDto: CreateRole = {
                label: 'admin',
            };

            jest.spyOn(service, 'createRole').mockRejectedValue(
                new HttpException('Role already exists', HttpStatus.CONFLICT),
            );
            jest.spyOn(service, 'verifyUserRole').mockResolvedValue(null);

            const req = { user: { id: '1' } };
            await expect(controller.create(createRoleDto, req)).rejects.toThrow(
                new HttpException('Role already exists', HttpStatus.CONFLICT),
            );
        });
    });

    describe('update', () => {
        it('should update a role', async () => {
            const updateRoleDto: UpdateRoleDto = { label: 'admin' };
            const result: Partial<Roles> = new Roles({
                id: '1',
                label: 'admin',
            });

            jest.spyOn(service, 'updateRole').mockResolvedValue(result);
            jest.spyOn(service, 'verifyUserRole').mockResolvedValue(null);

            const req = { user: { id: '1' } };
            expect(await controller.update(req, '1', updateRoleDto)).toBe(
                result,
            );
        });

        it('should throw an exception if the role is not found', async () => {
            const updateRoleDto: UpdateRoleDto = { label: 'admin' };

            jest.spyOn(service, 'updateRole').mockRejectedValue(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
            jest.spyOn(service, 'verifyUserRole').mockResolvedValue(null);

            const req = { user: { id: '1' } };
            await expect(
                controller.update(req, '1', updateRoleDto),
            ).rejects.toThrow(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
        });
    });

    describe('delete', () => {
        it('should delete a role', async () => {
            jest.spyOn(service, 'deleteRole').mockResolvedValue(
                'Role deleted successfully',
            );
            jest.spyOn(service, 'verifyUserRole').mockResolvedValue(null);

            const req = { user: { id: '1' } };
            expect(await controller.delete('1', req)).toBe(
                'Role deleted successfully',
            );
        });

        it('should throw an exception if the role is not found', async () => {
            jest.spyOn(service, 'deleteRole').mockRejectedValue(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
            jest.spyOn(service, 'verifyUserRole').mockResolvedValue(null);

            const req = { user: { id: '1' } };
            await expect(controller.delete('1', req)).rejects.toThrow(
                new HttpException('Role not found', HttpStatus.NOT_FOUND),
            );
        });
    });
});
