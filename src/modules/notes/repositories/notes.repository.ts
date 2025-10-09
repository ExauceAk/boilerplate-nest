import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Notes } from '../entities/notes.entity';
import { AbstractRepository } from 'src/infra/database/abstract.repository';

@Injectable()
export class NotesRepository extends AbstractRepository<Notes> {
  protected readonly logger = new Logger(NotesRepository.name);

  constructor(
    @InjectRepository(Notes)
    notesRepository: Repository<Notes>,
    entityManager: EntityManager,
  ) {
    super(notesRepository, entityManager);
  }
}
