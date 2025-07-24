import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from 'src/libs/database/abstract.repository';
import { EntityManager, Repository } from 'typeorm';
import { Status } from '../entities/status.entity';

@Injectable()
export class StatusRepository extends AbstractRepository<Status> {
    protected readonly logger = new Logger(StatusRepository.name);

    constructor(
        @InjectRepository(Status)
        statusRepository: Repository<Status>,
        entityManager: EntityManager,
    ) {
        super(statusRepository, entityManager);
    }
}
