import { Injectable, Logger } from '@nestjs/common';
import { UsersCode } from '../entities/user_code.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AbstractRepository } from 'src/infra/database/abstract.repository';

@Injectable()
export class UsersCodeRepository extends AbstractRepository<UsersCode> {
  protected readonly logger = new Logger(UsersCodeRepository.name);
  constructor(
    @InjectRepository(UsersCode)
    usersCodeRepository: Repository<UsersCode>,
    entityManager: EntityManager,
  ) {
    super(usersCodeRepository, entityManager);
  }

  async save(userCodeEntity: UsersCode): Promise<UsersCode> {
    return this.entityManager.save(userCodeEntity);
  }
}
