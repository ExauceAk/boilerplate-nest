import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersRepository } from 'src/modules/users/repositories/users.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly repository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async getUserById(id: string): Promise<any> {
    const user = await this.repository.findOne({
      where: { id, deleted: false },
    });
    if (!user) throw new UnauthorizedException('User not found');

    return user;
  }

  async validate(payload: any) {
    const user = await this.getUserById(payload.id);
    if (!user) throw new UnauthorizedException('No matching credentials found');
    return user;
  }
}

@Injectable()
export class TokenVerify {
  constructor(
    private readonly configService: ConfigService,
    private readonly repository: UsersRepository,
  ) {}

  async getUserById(id: string): Promise<any> {
    const user = await this.repository.findOne({
      where: { id, deleted: false },
    });
    if (!user) throw new UnauthorizedException('User not found');

    return user;
  }

  async validate(payload: any) {
    const user = await this.getUserById(payload.id);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async decode(token: string) {
    return jwt.decode(token, this.configService.get('JWT_SECRET'));
  }
}
