import {
  ArgumentMetadata,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserStatus } from 'src/common/enum/user.enum';
import { ErrorHandlingService } from 'src/common/response/errorHandler.service';
import { Files } from 'src/core/files/entities/file.entity';
import { FilesRepository } from 'src/core/files/files.repository';
import { RolesRepository } from 'src/core/roles/roles.repository';
import OtherUtils from 'src/utils/tools';
import { Logger } from 'winston';
import { formatValidationErrors } from '../../../common/response/validation-unique-error.helper';
import { PasswordHashService } from '../../../helpers/password_hash/passwordHash.service';
import { MailerService } from '../../../libs/mailer/mailer.service';
import { UpdatePasswordDto, UpdateProfileDto } from '../dto/other.dto';
import { Users } from '../entities/users.entity';
import { ResetPasswordRequestRepository } from '../repositories/reset_password.repository';
import { UsersCodeRepository } from '../repositories/user_code.repository';
import { UsersRepository } from '../repositories/users.repository';
import { ResetPasswordRequestService } from './resetPasswordRequest.service';
import { UserCodeService } from './users_code.service';

@Injectable()
export class UsersService {
  /**
   * Service responsible for managing users
   */

  readonly resetPasswordLink: string;
  readonly landingPageLink: string;

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
   * Retrieve a user by id
   * @param id - The ID of the user to retrieve
   * @returns Promise<Users> - The user object if found, otherwise throws an error
   */
  async getUserById(id: string): Promise<Users> {
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
            data.fullname.toLowerCase().includes(searchTermLower)) ||
          (data.username &&
            data.username.toLowerCase().includes(searchTermLower)) ||
          (data.email && data.email.toLowerCase().includes(searchTermLower))
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
}
