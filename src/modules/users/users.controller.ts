import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
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
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { UpdatePasswordDto, UpdateProfileDto } from './dto/other.dto';
import { Users } from './entities/users.entity';
import { UsersService } from './services/users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get the current user',
    description: 'Get the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the current user',
    type: Users,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUserFromToken(@Request() req: any) {
    return this.usersService.getUserById(req.user.id);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('')
  @ApiOperation({
    summary: 'Get the current user',
    description: 'Get the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the current user',
    type: Users,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getAllUsers(
    @Request() req: any,
    @Query('query') query: string,
    @Query('department') department: string,
    @Query('role') role: string,
    @Query('status') status: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
  ) {
    return this.usersService.getAllUsers(
      req.user.id,
      page,
      limit,
      query,
      department,
      role,
      status,
    );
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Patch('update-password')
  @ApiOperation({
    summary: 'Update a user password',
    description: 'Update a user password',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully.',
    type: Users,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  async updatePassword(
    @Req() req,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(req.user.id, updatePasswordDto);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Patch('update-profile')
  @ApiOperation({
    summary: 'Update a user password',
    description: 'Update a user password',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully.',
    type: Users,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }
}
