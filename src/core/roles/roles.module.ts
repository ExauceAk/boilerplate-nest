import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../common/guards/jwt.strategy';
import { LoggerModule } from '../../common/logger/logger.module';
import { DatabaseModule } from '../../libs/database/database.module';
import { UsersCode } from '../users/entities/user_code.entity';
import { Users } from '../users/entities/users.entity';
import { UsersRepository } from '../users/repositories/users.repository';
import { Roles } from './entities/roles.entity';
import { RolesController } from './roles.controller';
import { RolesRepository } from './roles.repository';
import { RolesSeeder } from './roles.seeder';
import { RolesService } from './roles.service';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([Roles, Users, UsersCode]),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        LoggerModule,
    ],
    controllers: [RolesController],
    providers: [
        JwtStrategy,
        ConfigService,
        RolesService,
        RolesRepository,
        RolesSeeder,
        UsersRepository,
    ],
    exports: [RolesService],
})
export class RolesModule {}
