import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailConfig } from 'src/config/mail.config';
import { TokenVerify } from '../../common/guards/jwt.strategy';
import { ErrorHandlingService } from '../../common/response/errorHandler.service';
import { Users } from './entities/users.entity';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/infra/database/database.module';
import { MailerModule } from 'src/infra/mailer/mailer.module';
import { PasswordHashService } from 'src/infra/password_hash/passwordHash.service';
import OtherUtils from 'src/common/utils/tools';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([Users]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    PasswordHashService,
    UsersRepository,
    MailConfig,
    TokenVerify,
    ErrorHandlingService,
    OtherUtils,
  ],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
