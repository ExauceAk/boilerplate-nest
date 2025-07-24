import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtStrategy } from './common/guards/jwt.strategy';
import { loggerTransports } from './common/logger/transports/transports';
import { FileModule } from './core/files/files.module';
import { RolesModule } from './core/roles/roles.module';
import { StatusModule } from './core/status/status.module';
import { UsersModule } from './core/users/users.module';
import { CacheModule } from './libs/cache/cache.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        WinstonModule.forRoot({
            transports: loggerTransports,
        }),
        FileModule.register(),
        UsersModule,
        RolesModule,
        StatusModule,
        CacheModule,
    ],
    controllers: [AppController],
    providers: [AppService, JwtStrategy],
})
export class AppModule {}
