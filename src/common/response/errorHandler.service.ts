import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class ErrorHandlingService {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger) {}

  returnErrorOnNotFound(loggerMessage: string, ErrorMessage: string) {
    this.logger.error(loggerMessage);
    throw new NotFoundException(ErrorMessage);
  }

  returnErrorOnBadRequest(loggerMessage: string, ErrorMessage: string) {
    this.logger.error(loggerMessage);
    throw new BadRequestException(ErrorMessage);
  }

  returnErrorOnForbidden(loggerMessage: string, ErrorMessage: string) {
    this.logger.error(loggerMessage);
    throw new ForbiddenException(ErrorMessage);
  }

  returnErrorOnConflict(loggerMessage: string, ErrorMessage: string) {
    this.logger.error(loggerMessage);
    throw new ConflictException(ErrorMessage);
  }
}
