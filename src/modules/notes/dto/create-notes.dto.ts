import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNotesDto {
  @ApiProperty({
    description: 'The name of the notes',
    example: 'Notes name',
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name should be a string' })
  name: string;

  @ApiProperty({
    description: 'The content of the notes',
    example: 'Notes content',
    type: 'string',
  })
  @IsString({ message: 'Content should be a string' })
  content: string;
}
