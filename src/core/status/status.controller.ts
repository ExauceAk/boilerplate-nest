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
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { StatusService } from './status.service';

@ApiTags('Status')
@Controller('status')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class StatusController {
    constructor(private readonly statusService: StatusService) {}

    @Post('')
    @ApiOperation({
        summary: 'Create status',
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
    create(@Body() createStatusDto: CreateStatusDto, @Request() req: any) {
        return this.statusService.create(createStatusDto, req.user.id);
    }

    @ApiOperation({
        summary: 'Get all the statuss',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Success',
    })
    @Get()
    @ApiQuery({ name: 'query', required: false, type: String })
    @ApiQuery({ name: 'category', required: false, type: String })
    findAll(
        @Request() req: any,
        @Query('query') query: string,
        @Query('category') category: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 5,
    ) {
        const validatedPage = Math.max(1, parseInt(page as any, 10) || 1);
        const validatedLimit = Math.min(
            100,
            Math.max(1, parseInt(limit as any, 10) || 5),
        );
        return this.statusService.findAll(
            req.user.id,
            validatedPage,
            validatedLimit,
            query,
        );
    }

    @ApiOperation({
        summary: 'Get a status by id',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Success',
    })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.statusService.findOne(id);
    }

    @ApiOperation({
        summary: 'Update a status',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Success',
    })
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateStatusDto,
        @Request() req: any,
    ) {
        return this.statusService.update(id, updateStatusDto, req.user.id);
    }

    @ApiOperation({
        summary: 'Delete a status',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Success',
    })
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.statusService.remove(id, req.user.id);
    }
}
