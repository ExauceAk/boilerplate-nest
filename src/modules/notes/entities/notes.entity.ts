import { AbstractEntity } from 'src/infra/database/abstract.entity';
import { Users } from 'src/modules/users/entities/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('notes')
export class Notes extends AbstractEntity<Notes> {
  @Column({ nullable: false })
  label: string;

  @Column({ nullable: true, type: 'text' })
  content: string;

  @ManyToOne(() => Users, { nullable: false })
  owner: Users;
}
