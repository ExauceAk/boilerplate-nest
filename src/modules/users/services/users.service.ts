import {
  ArgumentMetadata,
  Inject,
  Injectable,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ErrorHandlingService } from 'src/common/response/errorHandler.service';
import OtherUtils from 'src/common/utils/tools';
import { MailerService } from 'src/infra/mailer/mailer.service';
import { PasswordHashService } from 'src/infra/password_hash/passwordHash.service';
import { Logger } from 'winston';
import { formatValidationErrors } from '../../../common/response/validation-unique-error.helper';
import { UpdatePasswordDto, UpdateProfileDto } from '../dto/other.dto';
import { Users } from '../entities/users.entity';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  /**
   * Service responsible for managing users
   */

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
    readonly configService: ConfigService,
    readonly usersRepository: UsersRepository,
    readonly otherUtils: OtherUtils,
    readonly emailService: MailerService,
    readonly hashService: PasswordHashService,
    readonly errorHandlingService: ErrorHandlingService,
  ) {}

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
      this.errorHandlingService.returnErrorOnBadRequest(
        `Current Password Invalid`,
        `Current Password Invalid`,
      );
    }
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
   * Retrieve a user by id
   * @param id - The ID of the user to retrieve
   * @returns Promise<Users> - The user object if found, otherwise throws an error
   */
  async getUserById(id: string): Promise<Users> {
    this.logger.info(`Retrieving user with ID: ${id}`);
    const isUserExist = await this.usersRepository.findOne({
      where: { id },
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

    const isUserExist = await this.getUserById(userId);

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
    const { username, email } = updateProfileDto;

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

    await this.usersRepository.update(
      { id: userId },
      {
        username: username ?? isUserExist.username,
        email: email ?? isUserExist.email,
      },
    );
  }
}
