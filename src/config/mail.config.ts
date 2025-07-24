import { Configuration, Value } from '@itgorillaz/configify';
import { IsNotEmpty, IsString, IsBoolean, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

const toBoolean = (value: string) => ['1', 'true'].includes(value);

@Configuration()
export class MailConfig {
    @IsNotEmpty({ message: 'Mail host should not be empty' })
    @IsString({ message: 'Mail host should be a string' })
    @Value('MAIL_HOST')
    mailHost: string;

    @IsNotEmpty({ message: 'Mail port should not be empty' })
    @Transform(({ value }) => parseInt(value, 10))
    @Value('MAIL_PORT')
    mailPort: number;

    @IsNotEmpty({ message: 'Mail user should not be empty' })
    @IsEmail({}, { message: 'Mail user should be a valid email' })
    @Value('MAIL_USER')
    mailUser: string;

    @IsNotEmpty({ message: 'Mail password should not be empty' })
    @IsString({ message: 'Mail password should be a string' })
    @Value('MAIL_PASSWORD')
    mailPassword: string;

    @IsBoolean({ message: 'Mail secure should be a boolean' })
    @Value('MAIL_SECURE', { parse: toBoolean })
    mailSecure: boolean;
}
