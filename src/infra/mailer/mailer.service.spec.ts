import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { MailConfig } from '../../config';

describe('MailerService', () => {
    let service: MailerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailerService,
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

        service = module.get<MailerService>(MailerService);
        module.get<MailConfig>(MailConfig);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should send an email', async () => {
        const sendMailSpy = jest
            .spyOn(service['transporter'], 'sendMail')
            .mockResolvedValue({ messageId: '12345' });

        const result = await service.sendMail(
            'recipient@example.com',
            'Test Subject',
            '<p>Test Email</p>',
        );

        expect(sendMailSpy).toHaveBeenCalled();
        expect(result).toEqual({ messageId: '12345' });
    });
});
