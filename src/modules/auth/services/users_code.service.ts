import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VerifyUserCodeDto } from '../dto/verify-userCode.dto';
import { UsersCode } from '../entities/user_code.entity';
import { AuthService } from './auth.service';
import { Users } from 'src/modules/users/entities/users.entity';

@Injectable()
export class UserCodeService {
  /**
   * Service responsible for managing user's code
   */
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  /**
   * Get a user code by user id
   * @returns Promise<UsersCode> - The user code object
   * @param email - The user email
   */
  async getUserCodeByUserEmail(email: string): Promise<UsersCode> {
    this.authService.logger.info(
      `Searching for user code with user email: ${email}`,
    );
    const isUserCodeExist = await this.authService.userCodeRepository.findOne({
      where: {
        user: { email: email.trim(), deleted: false },
        deleted: false,
      },
      relations: ['user'],
    });
    if (!isUserCodeExist) {
      this.authService.logger.error(
        `User code with user email ${email} not found`,
      );
      throw new NotFoundException('OTP not found');
    }
    return isUserCodeExist;
  }

  /**
   * Verify user code provided with the existing one
   */
  async verifyUserCode(verifyUserCode: VerifyUserCodeDto): Promise<UsersCode> {
    const { email, code } = verifyUserCode;
    this.authService.logger.info(
      `Verifying user code with data: ${JSON.stringify(verifyUserCode)}`,
    );
    const isUserCodeExist = await this.getUserCodeByUserEmail(email);
    if (isUserCodeExist.expireAt < new Date()) {
      this.authService.logger.error(
        `User code has expired at ${isUserCodeExist.expireAt.toISOString()}`,
      );
      throw new BadRequestException('OTP expired');
    }
    const isCodeMatched = await this.authService.hashService.comparePassword(
      code,
      isUserCodeExist.code,
    );
    if (!isCodeMatched) {
      this.authService.logger.error(`User code is not valid`);
      throw new BadRequestException('Invalid OTP');
    }
    return isUserCodeExist;
  }

  /**
   * Increment the count of a user code and set the delay date if needed
   * @param userCode - The user code to increment
   * @returns Promise<UsersCode> - The updated user code object
   */
  async incrementCountAndSetDelayDate(userCode: UsersCode): Promise<string> {
    this.authService.logger.info(
      `Incrementing user code count and setting delay date`,
    );
    userCode.count += 1;
    const code = this.authService.otherUtils.generateNumber(6);
    userCode.code = await this.authService.hashService.hashPassword(code);
    userCode.expireAt = new Date(Date.now() + 6 * 60 * 1000);

    if (userCode.count >= 5) {
      this.authService.logger.info(`User code count is 5, setting delay date`);
      userCode.delayDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    await this.authService.userCodeRepository.update(
      { id: userCode.id },
      userCode,
    );
    return code;
  }

  /**
   * Create a new user code
   * @param user - The user to create the code for
   * @returns Promise<string> - The code generated
   */
  async createUserCode(user: Users) {
    this.authService.logger.info(`Creating user code with data: ${user.id}`);
    const isUserCodeExist = await this.authService.userCodeRepository.findOne({
      where: { user: { id: user.id }, deleted: false },
    });
    if (isUserCodeExist) return await this.askNewCode(user);

    const code = this.authService.otherUtils.generateNumber(6);
    const userCode = new UsersCode({
      user: user,
      code: await this.authService.hashService.hashPassword(code),
      expireAt: new Date(Date.now() + 6 * 60 * 1000),
      count: 0,
      // delayDate: null,
    });
    await this.authService.userCodeRepository.save(userCode);
    return code;
  }

  /**
   * Create a new user code
   * @returns Promise<UsersCode> - The created user code object
   * @param user - The user to create the code for
   */
  async askNewCode(user: Users) {
    this.authService.logger.info(`Creating user code with data: ${user.id}`);
    const isUserCodeExist = await this.authService.userCodeRepository.findOne({
      where: { user: { id: user.id }, deleted: false },
    });

    if (!isUserCodeExist) {
      this.authService.logger.warn(
        `User code not found, he should log in first`,
      );
      throw new ForbiddenException(
        'User code not found, he should log in first',
      );
    }

    this.authService.logger.info(
      'verifying if the user has reached the maximum attempt',
    );

    if (!isUserCodeExist.delayDate) {
      this.authService.logger.info(
        `User code count is less than 5, incrementing count`,
      );
      return await this.incrementCountAndSetDelayDate(isUserCodeExist);
    }

    if (isUserCodeExist.delayDate && isUserCodeExist.delayDate > new Date()) {
      this.authService.logger.warn(`User must wait until delay date`);
      const currentDate = new Date();
      const delayDate = isUserCodeExist.delayDate;
      const delayInHours = Math.ceil(
        (delayDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60),
      );

      throw new ConflictException(
        `Too many attempts, please retry in ${delayInHours} hours`,
      );
    }
    if (isUserCodeExist.delayDate && isUserCodeExist.delayDate < new Date()) {
      this.authService.logger.info(
        `User code delay date has passed, resetting count and delay date`,
      );
      // isUserCodeExist.delayDate = null;
      isUserCodeExist.count = 0;
      return await this.incrementCountAndSetDelayDate(isUserCodeExist);
    }
  }

  /**
   * Delete a user code by user id
   * @param userId - The ID of the user to delete the code for
   * @returns Promise<void> - The deleted user code object
   */
  async deleteUserCode(userId: string): Promise<object> {
    this.authService.logger.info(`Deleting user code with user ID: ${userId}`);
    await this.authService.userCodeRepository.delete({
      user: { id: userId, deleted: false },
    });
    return { message: 'Code deleted successfully' };
  }
}
