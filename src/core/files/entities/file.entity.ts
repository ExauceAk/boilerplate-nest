import { Column, Entity } from 'typeorm';
import { FileType } from '../../../common/enum/file_type.enum';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('files')
export class Files extends AbstractEntity<Files> {
    @Column({ nullable: false })
    objectName: string;

    @Column({ nullable: false })
    path: string;

    @Column({ nullable: true })
    height: number;

    @Column({ nullable: true })
    width: number;

    @Column({ default: 0, type: 'float', nullable: false })
    size: number;

    @Column({ nullable: false, type: 'enum', enum: FileType })
    type: string;

    @Column({ nullable: true, type: 'text' })
    expireDate: string;

    @Column({ default: false })
    isTemporary: boolean;
}
