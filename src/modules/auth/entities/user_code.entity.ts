import { AbstractEntity } from 'src/infra/database/abstract.entity';
import { Users } from 'src/modules/users/entities/users.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('users_code')
export class UsersCode extends AbstractEntity<UsersCode> {
  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  expireAt: Date;

  @Column({ default: 0 })
  count: number;

  @Column({ nullable: true })
  delayDate?: Date;

  @Column({ nullable: true })
  phoneNumber?: string;

  @ManyToOne(() => Users, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: Users;
}
