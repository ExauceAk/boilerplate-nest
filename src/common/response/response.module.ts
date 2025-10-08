import { Global, Module } from '@nestjs/common';
import { ErrorHandlingService } from './errorHandler.service';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [ErrorHandlingService],
  exports: [ErrorHandlingService],
})
export class ResponseModule {}
