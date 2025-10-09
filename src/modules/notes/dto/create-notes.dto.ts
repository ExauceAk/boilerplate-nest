import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNotesDto {
  @ApiProperty({
    description: 'The label of the notes',
    example: 'Notes label ',
  })
  @IsNotEmpty({ message: 'Label should be a string' })
  @IsString({ message: 'Label should be a string' })
  label: string;

  @ApiProperty({
    description: 'The content of the notes',
    example: 'Notes content',
    type: 'string',
  })
  @IsString({ message: 'Content should be a string' })
  content: string;
}
