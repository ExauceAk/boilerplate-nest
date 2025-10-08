import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenVerify } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PermissionsGuard implements CanActivate {
  readonly superAdminLabel: string;
  constructor(
    private reflector: Reflector,
    private readonly token: TokenVerify,
    private readonly configService: ConfigService,
  ) {
    this.superAdminLabel = this.configService
      .get<string>('SUPER_ADMIN')
      .toLowerCase();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Retrieve resource defined in @Permissions() decorator

    const permissions =
      this.reflector.get<string>('permissions', context.getHandler()) ||
      this.reflector.get<string>('permissions', context.getClass());

    if (!permissions) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader =
      request.headers['authorization'] || request.headers['Authorization'];

    const token = authHeader?.split(' ')[1];
    const tokenDecoded: any = await this.token.decode(token);
    const user: any = await this.token.getUserById(tokenDecoded?.id);
    const method = request.method.toLowerCase();

    if (user.role.label === this.superAdminLabel) return true;

    console.log('user', user);

    // Associate HTTP methods with actions
    const methodToActionMap = {
      post: 'Add',
      get: 'View',
      put: 'Edit',
      delete: 'Delete',
    };

    const requiredAction = methodToActionMap[method];

    if (!requiredAction)
      throw new ForbiddenException('HTTP method not authorized.');

    // const hasPermission = user.permissions?.some((permission: any) => {
    //     return (
    //         permission.action === requiredAction &&
    //         permission.ui === permissions
    //     );
    // });

    const hasPermission =
      user.permissions?.permissions.includes(requiredAction);

    if (!hasPermission)
      throw new ForbiddenException(
        'You do not have the necessary permissions to perform this action.',
      );

    return true;
  }
}
