import { Global, Module } from '@nestjs/common';
import { TokenVerify } from '../../common/guards/jwt.strategy';
import { LoggerModule } from '../../common/logger/logger.module';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { Users } from '../../core/users/entities/users.entity';
import { UsersRepository } from '../../core/users/repositories/users.repository';
import { DatabaseModule } from '../../libs/database/database.module';
import { WebsocketService } from './websocket.service';

@Global()
@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([Users]), LoggerModule],
    providers: [
        WebsocketService,
        TokenVerify,
        UsersRepository,
        ErrorHandlingService,
    ],
    exports: [WebsocketService, TokenVerify],
})
export class WebsocketModule {}
