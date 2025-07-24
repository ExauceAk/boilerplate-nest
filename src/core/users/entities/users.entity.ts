import { Exclude } from 'class-transformer';
import { UserStatus } from 'src/common/enum/user.enum';
import { Files } from 'src/core/files/entities/file.entity';
import { Roles } from 'src/core/roles/entities/roles.entity';
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
} from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UsersCode } from './user_code.entity';

@Entity('users')
export class Users extends AbstractEntity<Users> {
    @Column({ nullable: true })
    fullname: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true, unique: true })
    username: string;

    @ManyToOne(() => Files, { eager: false, nullable: true })
    @JoinColumn({ name: 'avatar' })
    avatar: Files;

    @ManyToOne(() => Roles, (roles) => roles.users, {
        eager: true,
        nullable: false,
    })
    @Index()
    role: Roles;

    @Exclude()
    @Column({ nullable: true })
    password: string;

    @Column({ nullable: false, default: 0 })
    points: number;

    @OneToOne(() => UsersCode, (userCode) => userCode.user)
    userCode: UsersCode;

    @Column({ type: 'boolean', default: false })
    hasTwoFA: boolean;

    @Column({ default: false })
    isAuthorized: boolean;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.REQUESTED,
        nullable: false,
    })
    status: string;
}
