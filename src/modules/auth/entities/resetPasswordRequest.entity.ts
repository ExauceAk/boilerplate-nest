import { AbstractEntity } from 'src/infra/database/abstract.entity';
import { Users } from 'src/modules/users/entities/users.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('reset_password_request')
export class ResetPasswordRequest extends AbstractEntity<ResetPasswordRequest> {
  @Column({ nullable: false })
  expireAt: Date;

  @Column({ default: 0 })
  count: number;

  @Column({ nullable: true })
  delayDate?: Date;

  @ManyToOne(() => Users, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: Users;

  constructor(entity: Partial<ResetPasswordRequest>) {
    super(entity);
    Object.assign(this, entity);
  }
}
