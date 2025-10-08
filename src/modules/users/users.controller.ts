import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { UpdatePasswordDto, UpdateProfileDto } from './dto/other.dto';
import { Users } from './entities/users.entity';
import { UsersService } from './services/users.service';

@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
