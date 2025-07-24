import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { Users } from '../entities/users.entity';

@Injectable()
export class UsersRepository extends AbstractRepository<Users> {
    protected readonly logger = new Logger(UsersRepository.name);

    constructor(
        @InjectRepository(Users)
        usersRepository: Repository<Users>,
        entityManager: EntityManager,
    ) {
        super(usersRepository, entityManager);
    }
}
