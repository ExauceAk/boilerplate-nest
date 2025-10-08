import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { AuthService } from './services/auth.service';
import { ResetPasswordRequestService } from './services/resetPasswordRequest.service';
import { Users } from '../users/entities/users.entity';
import { EmailDto, ResetPasswordDto } from '../users/dto/other.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly resetPasswordRequestService: ResetPasswordRequestService,
  ) {}

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
    return this.authService.getCurrentUser(req.user.id);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user and save it in the database',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully.',
    type: Users,
  })
  @ApiResponse({ status: 409, description: 'User already exist.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async register(@Body() createUser: RegisterUserDto) {
    return this.authService.register(createUser);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login a user',
    description: 'Login a user and return the user object',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully.',
    type: Users,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized, invalid password.',
  })
  async login(@Body() userCredentials: LoginUserDto) {
    return this.authService.login(userCredentials);
  }

  @Post('send-forgot-password-link')
  @ApiOperation({
    summary: 'Send a forgot password email to the user',
    description: 'Send a forgot password email to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'User send successfully.',
    type: Users,
  })
  @ApiResponse({ status: 404, description: 'User or code not found.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized, User not owner.' })
  async forgotPassword(@Body(ValidationPipe) emailDto: EmailDto) {
    return this.resetPasswordRequestService.createANewRequestForResetPassword(
      emailDto.email,
      new Date(Date.now() + 5 * 60 * 1000),
    );
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Login a user',
    description: 'Login a user and return the user object',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully.',
    type: Users,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized, invalid password.',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
