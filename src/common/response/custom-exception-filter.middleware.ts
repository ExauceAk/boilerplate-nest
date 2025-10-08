import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  QueryFailedError,
  EntityNotFoundError,
  EntityMetadataNotFoundError,
  EntityPropertyNotFoundError,
  PersistedEntityNotFoundError,
  CannotCreateEntityIdMapError,
  DataTypeNotSupportedError,
  TypeORMError,
} from 'typeorm';
import { Logger } from 'winston';

@Catch()
export class ErrorInterceptor
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super();
    this.logger = logger.child({ context: ErrorInterceptor.name });
  }

  async catch(
    exception: TypeORMError | Error | HttpException | ValidationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error!';
    let name = InternalServerErrorException.name;
    let stack: string = '';

    if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Bad input';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message || message;
      name = exception.name;
      stack = exception.stack || '';
    } else if (exception instanceof TypeORMError) {
      status = this.mapTypeORMErrorToHttpStatus(exception);
      message = exception.message;
      name = exception.name;
      stack = exception.stack || '';
    } else if (exception instanceof Error) {
      message = exception.message;
      name = exception.name;
      stack = exception.stack || '';
    }

    this.logger.error({
      statusCode: status,
      path: request.url,
      message,
      name,
      stack,
      ...(exception instanceof ValidationError && {
        value: exception.value,
        constraints: exception.constraints,
        property: exception.property,
        target: exception.target,
        contexts: exception.contexts,
      }),
    });

    response.status(status).json({
      statusCode: status,
      name,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }

  private mapTypeORMErrorToHttpStatus(error: TypeORMError): HttpStatus {
    switch (true) {
      case error instanceof QueryFailedError:
      case error instanceof CannotCreateEntityIdMapError:
      case error instanceof DataTypeNotSupportedError:
        return HttpStatus.BAD_REQUEST;
      case error instanceof EntityNotFoundError:
      case error instanceof EntityMetadataNotFoundError:
      case error instanceof EntityPropertyNotFoundError:
      case error instanceof PersistedEntityNotFoundError:
        return HttpStatus.NOT_FOUND;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
