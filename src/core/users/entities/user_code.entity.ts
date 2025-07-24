import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Users } from './users.entity';

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
