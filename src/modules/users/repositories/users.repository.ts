import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Users } from '../entities/users.entity';
import { AbstractRepository } from 'src/infra/database/abstract.repository';

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
