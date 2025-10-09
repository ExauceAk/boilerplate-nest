import { Exclude } from 'class-transformer';
import { Column, Entity, OneToOne } from 'typeorm';
import { UsersCode } from 'src/modules/auth/entities/user_code.entity';
import { AbstractEntity } from 'src/infra/database/abstract.entity';

@Entity('users')
export class Users extends AbstractEntity<Users> {
  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true, unique: true })
  username: string;

  @Exclude()
  @Column({ nullable: true })
  password: string;

  @OneToOne(() => UsersCode, (userCode) => userCode.user)
  userCode: UsersCode;

  constructor(entity: Partial<Users>) {
    super(entity);
    Object.assign(this, entity);
  }
}
