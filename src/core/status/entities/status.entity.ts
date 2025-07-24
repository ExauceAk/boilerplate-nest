import { AbstractEntity } from 'src/libs/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity('status')
export class Status extends AbstractEntity<Status> {
    @Column({ nullable: false, unique: true })
    name: string;

    @Column({ nullable: true })
    type: string;
}
