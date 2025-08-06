import { Inject, Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ErrorHandlingService } from 'src/common/response/errorHandler.service';
import { Logger } from 'winston';
import { Users } from '../users/entities/users.entity';
import { UsersRepository } from '../users/repositories/users.repository';
import { CreateNotesDto } from './dto/create-notes.dto';
import { UpdateNotesDto } from './dto/update-notes.dto';
import { Notes } from './entities/notes.entity';
import { NotesRepository } from './repositories/notes.repository';
@Injectable()
export class NotesService {
    readonly adminRole: string;
    readonly superAdminRole: string;
    constructor(
        private readonly notesRepository: NotesRepository,
        private readonly errorHandlingService: ErrorHandlingService,
        private readonly configService: ConfigService,
        private readonly usersRepository: UsersRepository,
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
    ) {
        this.adminRole = this.configService
            .get<string>('ADMIN_ROLE')
            .toLowerCase();
        this.superAdminRole = this.configService
            .get<string>('SUPER_ADMIN')
            .toLowerCase();
    }

    async isAdmin(userId: string): Promise<Users> {
        const isUserExist = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });

        if (!isUserExist) {
            this.errorHandlingService.returnErrorOnNotFound(
                `User not found`,
                `User not found`,
            );
        }

        if (
            !(
                isUserExist.role.label === this.superAdminRole ||
                isUserExist.role.label === this.adminRole
            )
        ) {
            this.errorHandlingService.returnErrorOnForbidden(
                `Access denied`,
                `Access denied for role ${isUserExist.role.label}`,
            );
        }
        return isUserExist;
    }

    /**
     * Create a new notes
     * @param createNotesDto - The data of the notes to create
     * @param userId - The user id
     * @returns Promise<Notes> - The created notes>
     */
    async create(createNotesDto: CreateNotesDto, userId: string) {
        await this.isAdmin(userId);
        const { name, type } = createNotesDto;

        const notes = new Notes({
            name,
            type,
        });
        return this.notesRepository.save(notes);
    }

    /**
     * Find all notes
     * @param userId - The user id
     * @returns Promise<Notes[]> - The found notes
     */
    async findAll(userId: string, page: number, limit: number, query: string) {
        const notess = await this.notesRepository.find({});

        let transformData = notess.map((notes) => {
            return {
                id: notes.id,
                name: notes.name,
                type: notes.type,
            };
        });

        if (query) {
            transformData = transformData.filter((data) => {
                const searchTermLower = query.toLowerCase();
                return (
                    (data.name &&
                        data.name.toLowerCase().includes(searchTermLower)) ||
                    (data.type &&
                        data.type.toLowerCase().includes(searchTermLower))
                );
            });
        }

        const paginatedData = transformData.slice(
            (page - 1) * limit,
            page * limit,
        );

        return {
            data: paginatedData,
            total: transformData.length,
            page,
            limit,
        };
    }

    private capitalizeFirstLetter(word: string): string {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    /**
     * Find a notes by id
     * @param id - The notes id
     * @param userId - The user id
     * @returns Promise<Notes> - The found notes
     */
    async findOne(id: string) {
        const notes = await this.notesRepository.findOne({
            where: { id },
        });

        if (!notes) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Notes not found`,
                `Notes not  found with id ${id}`,
            );
        }

        return {
            id: notes.id,
            name: notes.name,
            type: notes.type,
        };
    }

    /**
     * Update a notes
     * @param id - The notes id
     * @param updateNotesDto - The data of the notes to update
     * @param userId - The user id
     * @returns Promise<Notes> - The updated notes
     */
    async update(id: string, updateNotesDto: UpdateNotesDto, userId: string) {
        const { name, type } = updateNotesDto;

        await this.isAdmin(userId);

        const notes = await this.notesRepository.findOne({
            where: { id },
        });

        if (!notes) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Notes  not found`,
                `Notes not found`,
            );
        }

        return this.notesRepository.update(
            { id: notes.id },
            {
                name: name || notes.name,
                type: type || notes.type,
            },
        );
    }

    /**
     * Remove a notes
     * @param id - The notes id
     * @param userId - The user id
     * @returns
     */
    async remove(id: string, userId: string) {
        await this.isAdmin(userId);

        const notes = await this.notesRepository.findOne({
            where: { id },
            relations: ['owner'],
        });

        if (!notes) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Notes not found`,
                `Notes not found`,
            );
        }

        await this.notesRepository.softDelete({ id });

        return 'Notes deleted successfully';
    }
}
