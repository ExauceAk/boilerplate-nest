import { Configuration, Value } from '@itgorillaz/configify';
import { IsNotEmpty, IsString, IsBoolean, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

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

export default class EmailSendingConfig {
  public static readonly buildEmailTemplate = (...args: any[]) => {
    // Compile the welcome email template by providing the template path at index [0]
    const templatePath = path.join(__dirname, args[0]);
    const template = handlebars.compile(fs.readFileSync(templatePath, 'utf8'));

    // Generate the HTML for the email with the template data Object at index [1]
    return template(args[1]);
  };
}
