import { Users } from 'src/core/users/entities/users.entity';
import { AbstractEntity } from 'src/libs/database/abstract.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('notes')
export class Notes extends AbstractEntity<Notes> {
    @Column({ nullable: false })
    name: string;

    @Column({ nullable: true, type: 'text' })
    content: string;

    @ManyToOne(() => Users, { nullable: false })
    owner: Users;
}
