import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../core/users/repositories/users.repository';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtStrategy, TokenVerify } from './jwt.strategy';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let tokenVerify: TokenVerify;

  const mockUser = {
    id: '1',
    updatedAt: new Date(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '1234567890',
    prefix: 'Mr',
    username: 'johndoe',
    officeUsers: [],
    avatar: 'avatar.png',
    typeOffice: null,
    role: { id: '1', label: 'Admin' },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') {
        return 'secret';
      }
      return null;
    }),
  };

  const mockUsersRepository = {
    findOne: jest.fn((query) => {
      if (query.where.id === '1') {
        return Promise.resolve(mockUser);
      }
      return Promise.resolve(null);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        TokenVerify,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    tokenVerify = module.get<TokenVerify>(TokenVerify);
    module.get<ConfigService>(ConfigService);
    module.get<UsersRepository>(UsersRepository);
  });

  describe('validate', () => {
    it('should return a user if valid payload is provided', async () => {
      const payload = { id: '1' };
      const result = await jwtStrategy.validate(payload);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const payload = { id: '2' };
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('decode', () => {
    it('should decode the token correctly', async () => {
      const token = jwt.sign({ id: '1' }, 'secret');
      const result = await tokenVerify.decode(token);
      expect(result).toHaveProperty('id', '1');
    });
  });
});
