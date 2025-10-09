import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    description: `User's email `,
    example: `johndoe@gmail.com`,
  })
  @IsNotEmpty({ message: 'Email are required' })
  identity: string;

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
}
