import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesModule } from './roles.module';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RolesRepository } from './roles.repository';
import { Roles } from './entities/roles.entity';
import { RolesSeeder } from './roles.seeder';
import { DatabaseModule } from '../../libs/database/database.module';

describe('RolesModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [
                RolesModule,
                DatabaseModule,
                await ConfigModule.forRoot({
                    isGlobal: true,
                }),
            ],
        }).compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should provide RolesService', () => {
        expect(module.get<RolesService>(RolesService)).toBeDefined();
    });

    it('should provide RolesController', () => {
        expect(module.get<RolesController>(RolesController)).toBeDefined();
    });

    it('should provide RolesRepository', () => {
        expect(
            module.get<RolesRepository>(getRepositoryToken(Roles)),
        ).toBeDefined();
    });

    it('should provide RolesSeeder', () => {
        expect(module.get<RolesSeeder>(RolesSeeder)).toBeDefined();
    });
});
