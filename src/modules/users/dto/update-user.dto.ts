import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IsValidUrl } from '../../../common/decorators/isValidRCUrl.decorator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Firstname of the user',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Firstname should be a string' })
  firstname?: string;

  @ApiProperty({
    description: 'Lastname of the user',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Lastname should be a string' })
  lastname?: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'john doe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Username should be a string' })
  username?: string;

  @ApiProperty({
    description: 'Avatar file link of the user',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsValidUrl({
    message: 'Each X ray file link must be a valid  Catch URL',
  })
  avatar?: string;
}
