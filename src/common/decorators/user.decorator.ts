import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Users } from 'src/modules/users/entities/users.entity';

export const UserDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Users => {
    const request = ctx.switchToHttp().getRequest<Request & { user: Users }>();
    return request.user;
  },
);
