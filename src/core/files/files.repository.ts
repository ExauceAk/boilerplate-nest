import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { Files } from './entities/file.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class FilesRepository extends AbstractRepository<Files> {
    protected readonly logger = new Logger(FilesRepository.name);

    constructor(
        @InjectRepository(Files)
        fileRepository: Repository<Files>,
        entityManager: EntityManager,
    ) {
        super(fileRepository, entityManager);
    }
}
