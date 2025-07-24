import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from '../../libs/database/abstract.repository';
import { EntityManager, Repository } from 'typeorm';
import { Roles } from './entities/roles.entity';

@Injectable()
export class RolesRepository extends AbstractRepository<Roles> {
    protected readonly logger = new Logger(RolesRepository.name);

    constructor(
        @InjectRepository(Roles)
        roleRepository: Repository<Roles>,
        entityManager: EntityManager,
    ) {
        super(roleRepository, entityManager);
    }
}
