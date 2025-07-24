import { Test, TestingModule } from '@nestjs/testing';
import { RolesSeeder } from './roles.seeder';
import { RolesRepository } from './roles.repository';
import { Roles } from './entities/roles.entity';

describe('RolesSeeder', () => {
    let seeder: RolesSeeder;
    let repository: RolesRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RolesSeeder,
                {
                    provide: RolesRepository,
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();

        seeder = module.get<RolesSeeder>(RolesSeeder);
        repository = module.get<RolesRepository>(RolesRepository);
    });

    it('should be defined', () => {
        expect(seeder).toBeDefined();
    });

    it('should create app roles if they do not exist', async () => {
        jest.spyOn(repository, 'findOne').mockResolvedValue(null);

        await seeder.seed();

        expect(repository.findOne).toHaveBeenCalledTimes(3);
        expect(repository.create).toHaveBeenCalledTimes(3);
        expect(repository.create).toHaveBeenCalledWith(expect.any(Roles));
    });

    it('should not create app roles if they already exist', async () => {
        jest.spyOn(repository, 'findOne').mockResolvedValue({
            id: '46cb4bb0-cb60-4739-8894-b0142fe4c21b',
            label: 'user',
            deleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await seeder.seed();

        expect(repository.findOne).toHaveBeenCalledTimes(3);
        expect(repository.create).not.toHaveBeenCalled();
    });
});
