import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    Request,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { LoginUserDto } from './dto/login.dto';
import {
    EmailDto,
    ResetPasswordDto,
    UpdateAuthorizedDto,
    UpdatePasswordDto,
    UpdateProfileDto,
} from './dto/other.dto';
import { RegisterUserDto } from './dto/register.dto';
import { Users } from './entities/users.entity';
import { ResetPasswordRequestService } from './services/resetPasswordRequest.service';
import { UsersService } from './services/users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
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
        return this.usersService.getCurrentUser(req.user.id);
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
        return this.usersService.register(createUser);
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
        return this.usersService.login(userCredentials);
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
        return this.usersService.resetPassword(resetPasswordDto);
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
    @Patch('authorized/:id')
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
    async updateAuthorized(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateAuthorizedDto: UpdateAuthorizedDto,
        @Req() req,
    ) {
        return this.usersService.updateAuthorized(
            req.user.id,
            updateAuthorizedDto,
            id,
        );
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
    async updateProfile(
        @Req() req,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(req.user.id, updateProfileDto);
    }
}
