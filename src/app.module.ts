import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { loggerTransports } from './common/logger/transports/transports';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot({
      transports: loggerTransports,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
