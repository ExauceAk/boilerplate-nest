import { Inject, Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ErrorHandlingService } from 'src/common/response/errorHandler.service';
import { Logger } from 'winston';
import { UsersRepository } from '../users/repositories/users.repository';
import { CreateNotesDto } from './dto/create-notes.dto';
import { UpdateNotesDto } from './dto/update-notes.dto';
import { Notes } from './entities/notes.entity';
import { NotesRepository } from './repositories/notes.repository';
@Injectable()
export class NotesService {
  constructor(
    private readonly notesRepository: NotesRepository,
    private readonly errorHandlingService: ErrorHandlingService,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
  ) {}

  /**
   * Create a new notes
   * @param createNotesDto - The data of the notes to create
   * @param userId - The user id
   * @returns Promise<Notes> - The created notes>
   */
  async create(createNotesDto: CreateNotesDto, userId: string) {
    const { label, content } = createNotesDto;

    const owner = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!owner) {
      this.errorHandlingService.returnErrorOnNotFound(
        `User not found`,
        `User not found`,
      );
    }

    const notes = new Notes({
      label,
      content,
      owner,
    });
    return this.notesRepository.save(notes);
  }

  //Base relations required for transform notes data
  baseNoteRelation = ['owner'];

  /**
   * Transform data
   * @param data - The data to transform
   * @returns
   */
  private transformData(data: Notes) {
    return {
      id: data.id,
      name: data.label,
      content: data.content,
      owner: {
        id: data.owner.id,
        username: data.owner.username,
      },
    };
  }

  /**
   * Find all notes
   * @param userId - The user id
   * @returns Promise<Notes[]> - The found notes
   */
  async findAll(userId: string, page: number, limit: number, query: string) {
    //Get all notes from database
    const notess = await this.notesRepository.find({
      relations: [...this.baseNoteRelation],
    });

    let transformData = notess.map((notes) => this.transformData(notes));

    if (query) {
      transformData = transformData.filter((data) => {
        const searchTermLower = query.toLowerCase();
        return (
          (data.name && data.name.toLowerCase().includes(searchTermLower)) ||
          (data.content && data.content.toLowerCase().includes(searchTermLower))
        );
      });
    }

    const paginatedData = transformData.slice((page - 1) * limit, page * limit);

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

    return this.transformData(notes);
  }

  /**
   * Update a notes
   * @param id - The notes id
   * @param updateNotesDto - The data of the notes to update
   * @param userId - The user id
   * @returns Promise<Notes> - The updated notes
   */
  async update(
    id: string,
    updateNotesDto: UpdateNotesDto,
    userId: string,
  ): Promise<string> {
    const { label, content } = updateNotesDto;

    const notes = await this.notesRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!notes) {
      this.errorHandlingService.returnErrorOnNotFound(
        `Notes  not found`,
        `Notes not found`,
      );
    }

    if (notes.owner.id !== userId) {
      this.errorHandlingService.returnErrorOnForbidden(
        `Access denied`,
        `Access denied for user ${notes.owner.id}`,
      );
    }

    await this.notesRepository.update(
      { id: notes.id },
      {
        label: label || notes.label,
        content: content || notes.content,
      },
    );

    return 'Notes updated successfully';
  }

  /**
   * Remove a notes
   * @param id - The notes id
   * @param userId - The user id
   * @returns
   */
  async remove(id: string, userId: string) {
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

    if (notes.owner.id !== userId) {
      this.errorHandlingService.returnErrorOnForbidden(
        `Access denied`,
        `Access denied for user ${notes.owner.id}`,
      );
    }

    await this.notesRepository.softDelete({ id });

    return 'Notes deleted successfully';
  }
}
