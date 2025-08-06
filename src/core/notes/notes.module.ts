import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'src/common/logger/logger.module';
import { ErrorHandlingService } from 'src/common/response/errorHandler.service';
import { DatabaseModule } from 'src/libs/database/database.module';
import { Users } from '../users/entities/users.entity';
import { UsersRepository } from '../users/repositories/users.repository';
import { Notes } from './entities/notes.entity';
import { NotesRepository } from './repositories/notes.repository';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([Notes, Users]),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        LoggerModule,
    ],
    controllers: [NotesController],
    providers: [
        NotesService,
        NotesRepository,
        ErrorHandlingService,
        UsersRepository,
    ],
})
export class NotesModule {}
