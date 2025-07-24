import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Users } from 'src/core/users/entities/users.entity';

@Entity('roles')
export class Roles extends AbstractEntity<Roles> {
    @Column({ nullable: false })
    label: string;

    @OneToMany(() => Users, (user) => user.role)
    users: Users[];
}
