import {
    ArgumentMetadata,
    BadRequestException,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserStatus } from 'src/common/enum/user.enum';
import { ErrorHandlingService } from 'src/common/response/errorHandler.service';
import OtherUtils from 'src/utils/tools';
import { Logger } from 'winston';
import { formatValidationErrors } from '../../../common/response/validation-unique-error.helper';
import EmailSendingConfig from '../../../helpers/others/emailSendingConfig';
import { PasswordHashService } from '../../../helpers/password_hash/passwordHash.service';
import { MailerService } from '../../../libs/mailer/mailer.service';
import { LoginUserDto } from '../dto/login.dto';
import {
    ResetPasswordDto,
    UpdateAuthorizedDto,
    UpdatePasswordDto,
    UpdateProfileDto,
} from '../dto/other.dto';
import { RegisterUserDto } from '../dto/register.dto';
import { ResendUserCodeDto } from '../dto/resend-userCode.dto';
import { VerifyUserCodeDto } from '../dto/verify-userCode.dto';
import { Users } from '../entities/users.entity';
import { ResetPasswordRequestRepository } from '../repositories/reset_password.repository';
import { UsersCodeRepository } from '../repositories/user_code.repository';
import { UsersRepository } from '../repositories/users.repository';
import { ResetPasswordRequestService } from './resetPasswordRequest.service';
import { UserCodeService } from './users_code.service';
import { FilesRepository } from 'src/core/files/files.repository';
import { Roles } from 'src/core/roles/entities/roles.entity';
import { RolesRepository } from 'src/core/roles/roles.repository';
import { Files } from 'src/core/files/entities/file.entity';

@Injectable()
export class UsersService {
    /**
     * Service responsible for managing users
     */

    readonly resetPasswordLink: string;
    readonly landingPageLink: string;

    readonly adminRole: string;
    readonly superAdminRole: string;
    readonly userRole: string;

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        readonly configService: ConfigService,
        readonly usersRepository: UsersRepository,
        readonly otherUtils: OtherUtils,
        readonly emailService: MailerService,
        readonly hashService: PasswordHashService,
        readonly resetPasswordRequestRepository: ResetPasswordRequestRepository,
        readonly userCodeService: UserCodeService,
        readonly errorHandlingService: ErrorHandlingService,
        readonly userCodeRepository: UsersCodeRepository,
        @Inject(forwardRef(() => ResetPasswordRequestService))
        private readonly resetPasswordRequestService: ResetPasswordRequestService,
        private readonly filesRepository: FilesRepository,
        private readonly rolesRepository: RolesRepository,
    ) {
        this.configService.get<string>('LANDING_PAGE_LINK');
        this.resetPasswordLink = this.configService.get<string>(
            'RESET_PASSWORD_LINK',
        );
        this.landingPageLink =
            this.configService.get<string>('LANDING_PAGE_LINK');
        this.adminRole = this.configService
            .get<string>('ADMIN_ROLE')
            .toLowerCase();
        this.superAdminRole = this.configService
            .get<string>('SUPER_ADMIN')
            .toLowerCase();
        this.userRole = this.configService
            .get<string>('USER_ROLE')
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
     * Sends an email to a specified recipient with the given subject and HTML content.
     * Logs any errors that occur during the email sending process.
     */
    emailSend(email: string, subject: string, html: string): void {
        this.emailService
            .sendMail(email.trim(), subject, html)
            .catch((error) => {
                this.logger.info(`Email send failed: ${error}`);
            });
    }

    async validateUUIDs(uuids: string[]) {
        const uuidPipe = new ParseUUIDPipe({ version: '4' });
        const metadata: ArgumentMetadata = { type: 'param' };
        try {
            await Promise.all(
                uuids.map((uuid) => uuidPipe.transform(uuid, metadata)),
            );
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Verifies if a given username is available (i.e., not already in use).
     * Searches for the username in the user repository using the `findByCriteria` method.
     * Returns `true` if the username is available, otherwise returns `false`.
     */
    async findByCriteria(
        repository: any,
        criteria: { key: string; value: string },
        relations?: string[],
    ): Promise<any> {
        const { key, value } = criteria;
        return await repository.findOne({
            where: { [key]: value.trim(), deleted: false },
            relations: relations,
        });
    }

    /** Generate a JWT token
     * @param user - The user object
     * @returns string - The generated JWT token
     */
    private generateToken(user: Users) {
        const payload = { email: user.email, id: user.id };
        return jwt.sign(payload, this.configService.getOrThrow('JWT_SECRET'), {
            expiresIn: this.configService.get('JWT_EXPIRATION_TIME'),
        });
    }

    /**
     * Handle before login logic
     * @param user - The user object
     * @returns Promise<string> - The response message
     */
    async handleBeforeLoginLogic(user: Users): Promise<object> {
        const userCode = await this.userCodeService.createUserCode(user);
        console.log('otpCodeLog', userCode);
        const name = user.fullname ? user.fullname.trim() : 'User';
        const html = EmailSendingConfig.buildEmailTemplate(
            '../../../src/utils/templates/verify-code-email.hbs',
            {
                name,
                activation_code: userCode,
                year: new Date().getFullYear(),
                url: this.landingPageLink,
            },
        );
        this.emailSend(user.email, 'Email verification', html);
        return {
            message: `A one-time password (OTP) has been sent to your email address. Please check your mail and follow the instructions to complete the process.`,
        };
    }

    /**
     * Handle password match
     * @param password - The password
     * @param user - The user object
     * @returns Promise<Users> - The user object if the password matches, otherwise throws an error
     */
    private async checkPasswordWithHashed(password: string, user: Users) {
        const isPasswordValid = await this.hashService.comparePassword(
            password,
            user.password,
        );
        if (!isPasswordValid) {
            this.logger.warn(`Current Password Invalid`);
            throw new BadRequestException(`Current Password Invalid`);
        }
        return user;
    }

    /**
     * Generate a token response
     * @param user - The user object
     * @returns Promise<{ user: Users; token: string }> - The user object and the generated token
     */
    async generateUserTokenResponse(user: Users) {
        const token = this.generateToken(user);
        return { token };
    }

    async getCurrentUser(userId: string) {
        this.logger.info(`Retrieving current user`);

        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['role', 'department', 'avatar'],
        });

        if (!user) {
            this.errorHandlingService.returnErrorOnNotFound(
                `User not found`,
                `User not found`,
            );
        }

        return {
            id: user.id,
            fullname: user.fullname,
            username: user.username,
            email: user.email,
            isAuthorized: user.isAuthorized,
            avatar: user.avatar?.path ?? null,
            role: {
                id: user.role.id,
                label: user.role.label,
            },
        };
    }

    /**
     * Register a new user
     * @param registerUserDto
     * @returns
     */
    async register(registerUserDto: RegisterUserDto) {
        this.logger.info(
            `Registering user with data: ${JSON.stringify(registerUserDto)}`,
        );

        const { fullname, username, email, password, userAvatar } =
            registerUserDto;

        //hash password
        const hashedPassword = await this.hashService.hashPassword(password);

        // check if email already exist
        const isEmailExist = await this.usersRepository.findOne({
            where: { email: email },
        });
        if (isEmailExist) {
            this.errorHandlingService.returnErrorOnNotFound(
                'Email already exist',
                'Email already exist',
            );
        }

        // check if username already exist
        const isUsernameExist = await this.usersRepository.findOne({
            where: { username: username },
        });
        if (isUsernameExist) {
            this.errorHandlingService.returnErrorOnNotFound(
                'Username already exist',
                'Username already exist',
            );
        }

        const isFileExist = await this.filesRepository.findOne({
            where: { path: userAvatar },
        });

        if (!isFileExist) {
            this.errorHandlingService.returnErrorOnNotFound(
                'File not found',
                `File with id ${userAvatar} not found`,
            );
        }

        const users = await this.usersRepository.find({});

        let role: Roles;

        let isAuthorized: boolean;

        if (users.length > 0) {
            role = await this.rolesRepository.findOne({
                where: { label: this.userRole },
            });
            isAuthorized = false;
        } else {
            role = await this.rolesRepository.findOne({
                where: { label: this.superAdminRole },
            });
            isAuthorized = true;
        }

        const newUser = new Users({
            fullname,
            username,
            email,
            password: hashedPassword,
            avatar: isFileExist,
            role,
            isAuthorized,
        });

        await this.usersRepository.save(newUser);

        return `User registered successfully. Please login to verify your account.`;
    }

    /**
     * Login a user
     * @param loginDto - The data for the login
     * @returns Promise<Users> - The user object if found, otherwise throws an error
     */
    async login(loginDto: LoginUserDto) {
        const { identity, password } = loginDto;
        this.logger.info(`Logging in user with data: ${identity}`);

        const user = await this.usersRepository.findOne({
            where: { email: identity.trim(), deleted: false },
        });

        if (!user) {
            this.logger.error(`User with ${identity} not found`);
            throw new NotFoundException(`No account, register please`);
        }

        if (!user.isAuthorized) {
            this.errorHandlingService.returnErrorOnForbidden(
                `User not authorized`,
                `User not authorized`,
            );
        }

        if (!user.password) {
            this.logger.warn(
                `User doesn't have a password, sending an email to him to set up his password`,
            );
            throw new ForbiddenException(
                `Please click on forget password to set up your password`,
            );
        }

        await this.checkPasswordWithHashed(password, user);
        return await this.generateUserTokenResponse(user);
    }

    /**
     * Verify user code provided with the existing one
     * @param verifyUserCodeDto - The data for the verification
     * @returns Promise<Users> - The user object if verified, otherwise throws an error
     */
    async verifyUserCode(
        verifyUserCodeDto: VerifyUserCodeDto,
    ): Promise<{ token: string }> {
        const { email, code } = verifyUserCodeDto;
        this.logger.info(
            `Verifying user code with data: ${JSON.stringify(verifyUserCodeDto)}`,
        );
        const userCode = await this.userCodeService.verifyUserCode({
            email,
            code,
        });
        await this.userCodeService.deleteUserCode(userCode.user.id);
        const userToken = await this.generateUserTokenResponse(userCode.user);

        const userData = {
            id: userCode.user.id,
            email: userCode.user.email,
            fullname: userCode.user.fullname,
            status: UserStatus.ACTIVE,
        };

        return {
            ...userData,
            token: userToken.token,
        };
    }

    /**
     * Admin resend code to a user
     * @param resendUserCodeDto - The data for the resend
     * @returns Promise<Users> - The user object if found, otherwise throws an error
     */
    async resendUserCode(resendUserCodeDto: ResendUserCodeDto) {
        const { email } = resendUserCodeDto;
        this.logger.info(`Logging in user with data: ${email}`);

        const user = await this.usersRepository.findOne({
            where: { email: email?.trim(), deleted: false },
        });

        if (!user)
            this.errorHandlingService.returnErrorOnForbidden(
                `User with ${email} not found`,
                'Please check your credentials',
            );

        const isUserCodeExist = await this.userCodeRepository.findOne({
            where: { user: { id: user.id }, deleted: false },
        });

        if (!isUserCodeExist) {
            this.errorHandlingService.returnErrorOnForbidden(
                `User with UserCode not found`,
                'Please check try login again',
            );
        }

        await this.handleBeforeLoginLogic(user);
        return user;
    }

    /**
     * Change user password
     * @param user - The user object
     * @param password - The new password
     * @param delay - The delay in months for the password expiration
     * @returns Promise<void> - Updates the user's password
     */
    async passwordChange(user: Users, password: string): Promise<void> {
        await this.usersRepository.update(
            { id: user.id },
            {
                password,
            },
        );
    }

    /**
     * Reset user password
     * @param resetPasswordDto - The data for the password reset
     * @returns Promise<string> - The response message
     */
    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<object> {
        const { id, password, confirmPassword } = resetPasswordDto;
        this.logger.info(
            `Resetting password with data: ${JSON.stringify(resetPasswordDto)}`,
        );
        const validationErrors: Record<string, string> = {};
        const isPasswordMatch = this.otherUtils.verifyTwoWords(
            password,
            confirmPassword,
        );

        if (!isPasswordMatch) {
            this.logger.warn(`Password and confirm password do not match`);
            validationErrors['password'] = validationErrors['confirmPassword'] =
                `Password and confirm password should be the same`;
        }

        if (Object.keys(validationErrors).length > 0) {
            this.logger.warn(
                `Validation errors: ${JSON.stringify(validationErrors)}`,
            );
            throw formatValidationErrors(validationErrors);
        }

        const isUserExist =
            await this.resetPasswordRequestService.getResetPasswordRequestById(
                id,
            );
        this.logger.info(`Pre password change with data: ${password}`);

        const hashedPassword = await this.hashService.hashPassword(password);

        await this.passwordChange(isUserExist, hashedPassword);
        this.logger.info(`Post password change executed successfully`);

        await this.resetPasswordRequestService.deleteResetPasswordRequest(
            isUserExist.id,
        );
        return {
            message: `Password change successfully`,
        };
    }

    /**
     * Retrieve a user by id
     * @param id - The ID of the user to retrieve
     * @returns Promise<Users> - The user object if found, otherwise throws an error
     */
    async retrieveUserById(id: string): Promise<Users> {
        this.logger.info(`Retrieving user with ID: ${id}`);
        const isUserExist = await this.findByCriteria(this.usersRepository, {
            key: 'id',
            value: id,
        });
        if (!isUserExist) {
            this.logger.warn(`User with ID ${id} not found`);
            throw new NotFoundException('User not found');
        }
        return isUserExist;
    }

    /**
     * Update a user password
     * @param userId - The ID of the user to update the password
     * @param passwordDto - The data for the password update
     * @returns Promise<string> - The response message
     */
    async updatePassword(
        userId: string,
        passwordDto: UpdatePasswordDto,
    ): Promise<object> {
        const { currentPassword, newPassword, confirmPassword } = passwordDto;

        const validationErrors: Record<string, string> = {};

        const isPasswordMatch = this.otherUtils.verifyTwoWords(
            newPassword,
            confirmPassword,
        );

        if (currentPassword === newPassword) {
            this.logger.warn(`Current password and new password are the same`);
            validationErrors['currentPassword'] =
                `Old password and new password can't be the same`;
        }

        if (!isPasswordMatch) {
            this.logger.warn(`Password and confirm password do not match`);
            validationErrors['newPassword'] =
                `New password and confirm password should be the same`;
            validationErrors['confirmPassword'] =
                `New password and confirm password should be the same`;
        }

        if (Object.keys(validationErrors).length > 0) {
            this.logger.warn(
                `Validation errors: ${JSON.stringify(validationErrors)}`,
            );
            throw formatValidationErrors(validationErrors);
        }

        const isUserExist = await this.retrieveUserById(userId);

        await this.checkPasswordWithHashed(currentPassword, isUserExist);
        const hashedPassword = await this.hashService.hashPassword(newPassword);
        await this.usersRepository.update(
            { id: userId },
            { password: hashedPassword },
        );
        return { message: 'Password updated successfully' };
    }

    async updateAuthorized(
        userId: string,
        updateAuthorizedDto: UpdateAuthorizedDto,
        id: string,
    ) {
        await this.isAdmin(userId);

        const { isAuthorized } = updateAuthorizedDto;

        const isUserExist = await this.retrieveUserById(id);

        if (!isUserExist) {
            this.errorHandlingService.returnErrorOnNotFound(
                `User not found`,
                `User not found`,
            );
        }

        await this.usersRepository.update({ id }, { isAuthorized });
    }

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        this.logger.info(
            `Updating profile with data: ${JSON.stringify(updateProfileDto)}`,
        );
        const { fullname, username, email, userAvatar } = updateProfileDto;

        const isUserExist = await this.usersRepository.findOne({
            where: { id: userId },
        });

        if (!isUserExist) {
            this.errorHandlingService.returnErrorOnNotFound(
                `User not found`,
                `User not found`,
            );
        }

        const isExistEmail = await this.usersRepository.findOne({
            where: { email },
        });

        if (isExistEmail && isExistEmail.id !== userId) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Email already exist`,
                `Email already exist`,
            );
        }

        const isExistUsername = await this.usersRepository.findOne({
            where: { username },
        });

        if (isExistUsername && isExistUsername.id !== userId) {
            this.errorHandlingService.returnErrorOnNotFound(
                `Username already exist`,
                `Username already exist`,
            );
        }

        let avatar: Files;

        if (userAvatar) {
            avatar = await this.filesRepository.findOne({
                where: { path: userAvatar },
            });
        }

        await this.usersRepository.update(
            { id: userId },
            {
                fullname: fullname ?? isUserExist.fullname,
                username: username ?? isUserExist.username,
                email: email ?? isUserExist.email,
                avatar: avatar ?? isUserExist.avatar,
            },
        );
    }

    async getAllUsers(
        userId: string,
        page: number,
        limit: number,
        query: string,
        department: string,
        role: string,
        status,
    ) {
        this.logger.info(`Retrieving all users`);
        await this.isAdmin(userId);

        if (department) {
            const isValidDepartment = await this.validateUUIDs([department]);

            if (!isValidDepartment) {
                this.errorHandlingService.returnErrorOnNotFound(
                    `Department id not valid`,
                    `Department id not valid`,
                );
            }
        }

        if (role) {
            const isValidRole = await this.validateUUIDs([role]);

            if (!isValidRole) {
                this.errorHandlingService.returnErrorOnNotFound(
                    `Role id not valid`,
                    `Role id not valid`,
                );
            }
        }

        if (status) {
            const isValidStatus = Object.values(UserStatus).includes(
                status as UserStatus,
            );

            if (!isValidStatus) {
                this.errorHandlingService.returnErrorOnNotFound(
                    `Status not valid`,
                    `Status not valid`,
                );
            }
        }

        const users = await this.usersRepository.find({
            where: {
                role: { id: role },
                status: status,
            },
            relations: ['role', 'department', 'avatar'],
        });

        let transformData = users.map((user) => {
            return {
                id: user.id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                isAuthorized: user.isAuthorized,
                avatar: user.avatar.path ?? null,
                role: {
                    id: user.role.id,
                    label: user.role.label,
                },
            };
        });

        if (query) {
            transformData = transformData.filter((data) => {
                const searchTermLower = query.toLowerCase();
                return (
                    (data.fullname &&
                        data.fullname
                            .toLowerCase()
                            .includes(searchTermLower)) ||
                    (data.username &&
                        data.username
                            .toLowerCase()
                            .includes(searchTermLower)) ||
                    (data.email &&
                        data.email.toLowerCase().includes(searchTermLower))
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
}
