import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - start;

      const logData = {
        message: `${method} ${originalUrl} ${statusCode} - ${responseTime}ms`,
        method,
        url: originalUrl,
        statusCode,
        responseTime,
        body: req.body ?? undefined,
      };

      if (method === 'POST' && req.body) logData.body = req.body;

      this.logger.info(logData);
    });

    next();
  }
}
