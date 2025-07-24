import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '../../../libs/database/abstract.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ResetPasswordRequest } from '../entities/resetPasswordRequest.entity';

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
