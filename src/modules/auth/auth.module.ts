import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import OtherUtils from 'src/common/utils/tools';
import { MailConfig } from 'src/config/mail.config';
import { DatabaseModule } from 'src/infra/database/database.module';
import { MailerModule } from 'src/infra/mailer/mailer.module';
import { MailerService } from 'src/infra/mailer/mailer.service';
import { TokenVerify } from '../../common/guards/jwt.strategy';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { Users } from '../users/entities/users.entity';
import { UsersRepository } from '../users/repositories/users.repository';
import { UsersService } from '../users/services/users.service';
import { AuthController } from './auth.controller';
import { ResetPasswordRequest } from './entities/resetPasswordRequest.entity';
import { UsersCode } from './entities/user_code.entity';
import { ResetPasswordRequestRepository } from './repositories/reset_password.repository';
import { UsersCodeRepository } from './repositories/user_code.repository';
import { ResetPasswordRequestService } from './services/resetPasswordRequest.service';
import { UserCodeService } from './services/users_code.service';
import { PasswordHashService } from 'src/infra/password_hash/passwordHash.service';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([Users, UsersCode, ResetPasswordRequest]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule,
  ],
  controllers: [AuthController],
  providers: [
    UsersService,
    PasswordHashService,
    UsersCodeRepository,
    UserCodeService,
    UsersRepository,
    MailerService,
    MailConfig,
    TokenVerify,
    ResetPasswordRequestRepository,
    ResetPasswordRequestService,
    ErrorHandlingService,
    OtherUtils,
  ],
  exports: [UsersService, UsersCodeRepository, ResetPasswordRequestService],
})
export class UsersModule {}
