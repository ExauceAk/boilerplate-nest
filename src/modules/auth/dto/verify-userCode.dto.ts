import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyUserCodeDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'johndoe@gmail.com',
  })
  @IsEmail({}, { message: 'The user email must be a valid email' })
  @IsNotEmpty({ message: 'The user email is required' })
  email: string;

  @ApiProperty({ description: "The user's code", example: '123456' })
  @IsNotEmpty({ message: 'The user code is required' })
  @IsString({ message: 'The user code must be a string' })
  code: string;
}
