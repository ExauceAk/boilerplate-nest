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
import { ErrorHandlingService } from 'src/common/response/errorHandler.service';
import OtherUtils from 'src/common/utils/tools';
import { MailerService } from 'src/infra/mailer/mailer.service';
import { PasswordHashService } from 'src/infra/password_hash/passwordHash.service';
import { ResetPasswordDto } from 'src/modules/users/dto/other.dto';
import { Users } from 'src/modules/users/entities/users.entity';
import { UsersRepository } from 'src/modules/users/repositories/users.repository';
import { Logger } from 'winston';
import { formatValidationErrors } from '../../../common/response/validation-unique-error.helper';
import { LoginUserDto } from '../dto/login.dto';
import { RegisterUserDto } from '../dto/register.dto';
import { ResetPasswordRequestRepository } from '../repositories/reset_password.repository';
import { UsersCodeRepository } from '../repositories/user_code.repository';
import { ResetPasswordRequestService } from './resetPasswordRequest.service';
import { UserCodeService } from './users_code.service';
import EmailSendingConfig from 'src/config/mail.config';

@Injectable()
export class AuthService {
  /**
   * Service responsible for managing users
   */

  readonly resetPasswordLink: string | undefined;
  readonly landingPageLink: string | undefined;

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
  ) {
    this.configService.get<string>('LANDING_PAGE_LINK');
    this.resetPasswordLink = this.configService.get<string>(
      'RESET_PASSWORD_LINK',
    );
    this.landingPageLink = this.configService.get<string>('LANDING_PAGE_LINK');
  }

  /**
   * Sends an email to a specified recipient with the given subject and HTML content.
   * Logs any errors that occur during the email sending process.
   */
  emailSend(email: string, subject: string, html: string): void {
    this.emailService.sendMail(email.trim(), subject, html).catch((error) => {
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
    const name = user.username ? user.username.trim() : 'User';
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
      username: user.username,
      email: user.email,
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

    const { username, email, password } = registerUserDto;

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

    const newUser = new Users({
      username,
      email,
      password: hashedPassword,
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
      await this.resetPasswordRequestService.getResetPasswordRequestById(id);
    this.logger.info(`Pre password change with data: ${password}`);

    const hashedPassword = await this.hashService.hashPassword(password);

    await this.usersRepository.update(
      { id: isUserExist.id },
      {
        password: hashedPassword,
      },
    );
    this.logger.info(`Post password change executed successfully`);

    await this.resetPasswordRequestService.deleteResetPasswordRequest(
      isUserExist.id,
    );
    return {
      message: `Password change successfully`,
    };
  }
}
