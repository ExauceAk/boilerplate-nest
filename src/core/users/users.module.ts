import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TokenVerify } from '../../common/guards/jwt.strategy';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { MailConfig } from '../../config';
import { PasswordHashService } from '../../helpers/password_hash/passwordHash.service';
import { DatabaseModule } from '../../libs/database/database.module';
import { MailerModule } from '../../libs/mailer/mailer.module';
import { MailerService } from '../../libs/mailer/mailer.service';
import DetermineFileType from '../../utils/file_type';
import OtherUtils from '../../utils/tools';
import { ResetPasswordRequest } from './entities/resetPasswordRequest.entity';
import { UsersCode } from './entities/user_code.entity';
import { Users } from './entities/users.entity';
import { ResetPasswordRequestRepository } from './repositories/reset_password.repository';
import { UsersCodeRepository } from './repositories/user_code.repository';
import { UsersRepository } from './repositories/users.repository';
import { ResetPasswordRequestService } from './services/resetPasswordRequest.service';
import { UsersService } from './services/users.service';
import { UserCodeService } from './services/users_code.service';
import { UsersController } from './users.controller';
import { FilesRepository } from '../files/files.repository';
import { Files } from '../files/entities/file.entity';
import { RolesRepository } from '../roles/roles.repository';
import { Roles } from '../roles/entities/roles.entity';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([
            Users,
            UsersCode,
            ResetPasswordRequest,
            Files,
            Roles,
        ]),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MailerModule,
        DetermineFileType,
    ],
    controllers: [UsersController],
    providers: [
        UsersService,
        PasswordHashService,
        UsersCodeRepository,
        UserCodeService,
        UsersRepository,
        MailerService,
        DetermineFileType,
        MailConfig,
        TokenVerify,
        ResetPasswordRequestRepository,
        ResetPasswordRequestService,
        ErrorHandlingService,
        OtherUtils,
        FilesRepository,
        RolesRepository,
    ],
    exports: [
        UsersService,
        UsersCodeRepository,
        UsersRepository,
        ResetPasswordRequestService,
    ],
})
export class UsersModule {}
