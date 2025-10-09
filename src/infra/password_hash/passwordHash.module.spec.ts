import { Test, TestingModule } from '@nestjs/testing';
import { PasswordHashService } from './passwordHash.service';

describe('PasswordHashModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide Password_hashService', () => {
    const passwordHash = module.get<PasswordHashService>(PasswordHashService);
    expect(passwordHash).toBeDefined();
  });
});
