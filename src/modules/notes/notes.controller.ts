import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { CreateNotesDto } from './dto/create-notes.dto';
import { UpdateNotesDto } from './dto/update-notes.dto';
import { NotesService } from './notes.service';
import { UserDecorator } from 'src/common/decorators/user.decorator';
import { Users } from '../users/entities/users.entity';

@ApiTags('Notes')
@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  /**
   * Create a new notes
   * @param createNotesDto - The data of the notes to create
   * @param req - The request object
   * @returns Promise<Notes> - The created notes>
   */
  @Post('')
  @ApiOperation({
    summary: 'Create notes',
  })
  @ApiResponse({
    status: 201,
    description: 'Success',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  create(@Body() createNotesDto: CreateNotesDto, @UserDecorator() user: Users) {
    return this.notesService.create(createNotesDto, user.id);
  }

  /**
   * Get all the notess
   * @param req - The request object
   * @param query - The query string
   * @param category - The category string
   * @param page - The page number
   * @param limit - The limit number
   * @returns Promise<Notes[]> - The found notes
   */

  @Get()
  @ApiOperation({
    summary: 'Get all the notess',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success',
  })
  @ApiQuery({ name: 'query', required: false, type: String })
  findAll(
    @UserDecorator() user: Users,
    @Query('query') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
  ) {
    const validatedPage = Math.max(1, parseInt(page.toString(), 10) || 1);
    const validatedLimit = Math.min(
      100,
      Math.max(1, parseInt(limit.toString(), 10) || 5),
    );
    return this.notesService.findAll(
      user.id,
      validatedPage,
      validatedLimit,
      query,
    );
  }

  /**
   * Get a notes by id
   * @param id - The notes id
   * @param req - The request object
   * @returns Promise<Notes> - The found notes
   */

  @Get(':id')
  @ApiOperation({
    summary: 'Get a notes by id',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success',
  })
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(id);
  }

  /**
   * Update a notes
   * @param id - The notes id
   * @param updateNotesDto - The update notes dto
   * @param req - The request object
   * @returns Promise<Notes> - The updated notes
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a notes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success',
  })
  update(
    @Param('id') id: string,
    @Body() updateNotesDto: UpdateNotesDto,
    @UserDecorator() user: Users,
  ) {
    return this.notesService.update(id, updateNotesDto, user.id);
  }

  /**
   * Delete a notes
   * @param id - The notes id
   * @param req - The request object
   * @returns Promise<Notes> - The deleted notes
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a notes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Success',
  })
  remove(@Param('id') id: string, @UserDecorator() user: Users) {
    return this.notesService.remove(id, user.id);
  }
}
