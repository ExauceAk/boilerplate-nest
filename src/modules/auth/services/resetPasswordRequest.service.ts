import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResetPasswordRequest } from '../entities/resetPasswordRequest.entity';
import EmailSendingConfig from 'src/config/mail.config';
import { Users } from 'src/modules/users/entities/users.entity';
import { UsersService } from 'src/modules/users/services/users.service';

@Injectable()
export class ResetPasswordRequestService {
  constructor(
    // @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  /**
   * Validate the request dates
   * @param request The request to validate
   * @returns void if the request is valid
   * @private Throws an error if the request is invalid
   */
  private validateRequestDates(request: ResetPasswordRequest) {
    const now = new Date();

    if (request.delayDate && request.delayDate > now) {
      const timeDiff = request.delayDate.getTime() - now.getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      this.usersService.resetPasswordRequestRepository.update(
        { id: request.id },
        { count: 1 },
      );
      throw new ForbiddenException(
        `You must wait ${hours} hours and ${minutes} minutes before requesting another link.`,
      );
    }
  }

  /**
   * Validate the request dates
   * @param request The request to validate
   * @returns void if the request is valid
   * @private Throws an error if the request is invalid
   */
  private validateRequestDelais(request: ResetPasswordRequest) {
    const now = new Date();

    if (request.expireAt < now) {
      this.usersService.logger.warn('Reset password link expired.');
      throw new ForbiddenException(
        'Reset password link has expired. Please request a new link.',
      );
    }
  }

  /**
   * Send a reset password email to the user
   * @param user The user to send the email to
   * @param resetRequestId The reset request id
   * @private Does not return anything
   */
  private sendResetPasswordEmail(user: Users, resetRequestId: string): void {
    const { fullname, email } = user;
    const name = fullname ? fullname.trim() : 'User';
    const resetPasswordLink = `${this.usersService.resetPasswordLink}${resetRequestId}`;
    const emailTemplate = EmailSendingConfig.buildEmailTemplate(
      '../../../src/utils/templates/forgot-password.hbs',
      {
        name,
        resetPasswordLink,
        email,
        url: this.usersService.landingPageLink,
        year: new Date().getFullYear(),
      },
    );

    this.usersService.emailService
      .sendMail(email.trim(), 'Reset Password', emailTemplate)
      .catch((error) => {
        this.usersService.logger.error(`Email failed to send: ${error}`);
      });
  }

  /**
   * Handle the reset password request
   * @param user The user to handle the request for
   * @param passwordExpireAt The expiration date of the reset password request
   * @private Returns the reset password request
   */
  async handleResetPasswordRequest(
    user: Users,
    passwordExpireAt: Date,
  ): Promise<ResetPasswordRequest> {
    const existingRequest =
      await this.usersService.resetPasswordRequestRepository.findOne({
        where: { user: { id: user.id }, deleted: false },
      });

    if (existingRequest) {
      this.validateRequestDates(existingRequest);

      existingRequest.count += 1;
      existingRequest.expireAt = passwordExpireAt;

      if (existingRequest.count >= 5) {
        existingRequest.delayDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }

      await this.usersService.resetPasswordRequestRepository.update(
        { id: existingRequest.id },
        existingRequest,
      );
      return existingRequest;
    }

    return this.usersService.resetPasswordRequestRepository.create(
      new ResetPasswordRequest({
        user,
        expireAt: passwordExpireAt,
        count: 1,
      }),
    );
  }

  /**
   * Get a reset password request by ID
   * @param id The ID of the reset password request
   * @returns Promise<Users> - The user object if found, otherwise throws an error
   */
  async getResetPasswordRequestById(id: string): Promise<Users> {
    const resetRequest =
      await this.usersService.resetPasswordRequestRepository.findOne({
        where: { id, deleted: false },
        relations: ['user', 'user'],
      });

    if (!resetRequest) {
      this.usersService.logger.error('Reset password request not found');
      throw new NotFoundException('Reset password request not found');
    }

    this.validateRequestDelais(resetRequest);

    return resetRequest.user;
  }

  async createNewRequestWithoutSendingEmail(
    user: Users,
    expiredAt: Date,
  ): Promise<ResetPasswordRequest> {
    return await this.handleResetPasswordRequest(user, expiredAt);
  }

  /**
   * Create a new request for reset password
   * @param email The email of the user to create the request for
   * @param expiredAt The expiration date of the reset password request
   * @returns Promise<object> - The response message
   */
  async createANewRequestForResetPassword(email: string, expiredAt: Date) {
    const isUserExist = await this.usersService.usersRepository.findOne({
      where: { email, deleted: false },
    });

    if (!isUserExist) {
      this.usersService.logger.error('User not found');
      throw new NotFoundException('User not found');
    }
    const resetRequest = await this.handleResetPasswordRequest(
      isUserExist,
      expiredAt,
    );

    setImmediate(() => {
      try {
        this.sendResetPasswordEmail(isUserExist, resetRequest.id);
      } catch (error) {
        this.usersService.logger.error(
          'Failed to send reset password email',
          error,
        );
      }
    });

    return 'Link sent successfully';
  }

  /**
   * Delete a reset password request
   * @param userId - The ID of the user to delete the request for
   * @returns Promise<object> - The response message
   */
  async deleteResetPasswordRequest(userId: string): Promise<object> {
    this.usersService.logger.info(
      `Deleting reset password request for user ID: ${userId}`,
    );
    await this.usersService.resetPasswordRequestRepository.delete({
      user: { id: userId, deleted: false },
    });
    return { message: 'Request deleted successfully' };
  }
}
