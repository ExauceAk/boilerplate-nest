import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'src/common/logger/logger.module';
import { ErrorHandlingService } from 'src/common/response/errorHandler.service';
import { DatabaseModule } from 'src/libs/database/database.module';
import { Users } from '../users/entities/users.entity';
import { UsersRepository } from '../users/repositories/users.repository';
import { Status } from './entities/status.entity';
import { StatusRepository } from './repositories/status.repository';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([Status, Users]),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        LoggerModule,
    ],
    controllers: [StatusController],
    providers: [
        StatusService,
        StatusRepository,
        ErrorHandlingService,
        UsersRepository,
    ],
})
export class StatusModule {}
