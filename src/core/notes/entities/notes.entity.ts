import { AbstractEntity } from 'src/libs/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity('notes')
export class Notes extends AbstractEntity<Notes> {
    @Column({ nullable: false, unique: true })
    name: string;

    @Column({ nullable: true })
    type: string;
}
