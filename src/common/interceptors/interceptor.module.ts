import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CircularInterceptor } from './circular.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CircularInterceptor,
    },
  ],
})
export class InterceptorModule {}
