import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ResetPasswordRequest } from '../entities/resetPasswordRequest.entity';
import { AbstractRepository } from 'src/infra/database/abstract.repository';

@Injectable()
export class ResetPasswordRequestRepository extends AbstractRepository<ResetPasswordRequest> {
  protected readonly logger = new Logger(ResetPasswordRequestRepository.name);
  constructor(
    @InjectRepository(ResetPasswordRequest)
    resetPasswordRequestRepository: Repository<ResetPasswordRequest>,
    entityManager: EntityManager,
  ) {
    super(resetPasswordRequestRepository, entityManager);
  }
}
