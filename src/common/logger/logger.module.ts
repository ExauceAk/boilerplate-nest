import { MiddlewareConsumer, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { loggerTransports } from './transports/transports';
import { LoggingMiddleware } from './logging.middleware';
import * as winston from 'winston';

const colorizer = winston.format.colorize();

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: loggerTransports,
      level: 'debug',
      format: winston.format.combine(
        winston.format.label({
          label: '[LOGGER]',
        }),
        winston.format.timestamp(),
        winston.format.printf(
          ({ label, level, message, context, timestamp, name }) =>
            colorizer.colorize(
              level,
              `${label} ${timestamp} [${context || 'UnknownContext'}] [${name}] ${level}: ${message}`,
            ),
        ),
      ),
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
