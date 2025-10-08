import { Test, TestingModule } from '@nestjs/testing';
import { MailerModule } from './mailer.module';
import { MailerService } from './mailer.service';
import { MailConfig } from 'src/config/mail.config';

describe('MailerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [MailerModule],
      providers: [
        {
          provide: MailConfig,
          useValue: {
            mailHost: 'smtp.example.com',
            mailPort: 587,
            mailSecure: false,
            mailUser: 'test@example.com',
            mailPassword: 'password',
          },
        },
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide MailerService', () => {
    const mailerService = module.get<MailerService>(MailerService);
    expect(mailerService).toBeDefined();
  });
});
