import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendUserCodeDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'johndoe@gmail.com',
  })
  @IsEmail({}, { message: 'The user email must be a valid email' })
  @IsNotEmpty({ message: 'The user email is required' })
  email: string;
}
