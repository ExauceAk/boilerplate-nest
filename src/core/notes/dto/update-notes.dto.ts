import { PartialType } from '@nestjs/swagger';
import { CreateNotesDto } from './create-notes.dto';

export class UpdateNotesDto extends PartialType(CreateNotesDto) {}
