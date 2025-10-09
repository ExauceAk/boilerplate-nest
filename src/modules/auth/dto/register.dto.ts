import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    description: 'Username',
    example: 'Doe',
  })
  @IsNotEmpty({ message: 'Username should be required' })
  @IsString({ message: 'Username should be a string' })
  @MinLength(2, {
    message: 'Username should be at least 2 characters',
  })
  username: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'johndoe@gmail.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'The email format is not valid' })
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'Password1!',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, {
    message: 'Password must be at least 6 characters long',
  })
  password: string;

  @ApiProperty({
    description: 'Confirm password of the user',
    example: 'Password1!',
  })
  @IsNotEmpty({ message: 'Confirm password is required' })
  @IsString({ message: 'Confirm password must be a string' })
  confirmPassword: string;
}
