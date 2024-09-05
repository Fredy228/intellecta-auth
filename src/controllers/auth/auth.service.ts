import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { Details } from 'express-useragent';
import { User, UserDevices } from 'lib-intellecta-entity';
import * as dotenv from 'dotenv';
import * as process from 'process';

dotenv.config();

import { LoginAuthDto, RegisterAuthDto } from './auth.dto';
import { TokenType } from '../../types/token-type';
import { CustomException } from '../../services/custom-exception';
import { checkPassword, hashPassword } from '../../services/hashPassword';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(UserDevices)
    private devicesRepository: Repository<UserDevices>,
    private jwtService: JwtService,
    private readonly entityManager: EntityManager,
  ) {}

  async signInCredentials({
    email,
    password,
    userAgent,
  }: LoginAuthDto & { userAgent: Details }): Promise<User & TokenType> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: {
        devices: true,
        profiles: true,
      },
      select: {
        profiles: {
          id: true,
          title: true,
          role: true,
        },
      },
    });

    if (!user)
      throw new CustomException(
        HttpStatus.UNAUTHORIZED,
        `Username or password is wrong`,
      );

    const deviceModel = `${userAgent.platform} ${userAgent.os} ${userAgent.browser}`;

    if (user?.security?.is_block)
      throw new CustomException(423, `User blocked`);

    const is_time_try =
      user?.security?.login_time &&
      new Date().getTime() - new Date(user.security.login_time).getTime() <
        3600 * 1000;
    if (is_time_try) {
      const time_try =
        new Date(user?.security?.login_time).getTime() +
        3600 * 1000 -
        new Date().getTime();
      throw new CustomException(
        425,
        `Try again in ${Math.round(time_try / 1000 / 60)} minutes`,
      );
    }

    const isValidPass = await checkPassword(password, user.password);

    if (!isValidPass) {
      if (
        user?.security?.login_attempts === 5 ||
        user?.security?.login_attempts === 10
      ) {
        user.security.login_time = new Date();
        await this.usersRepository.save(user);
      }

      if (user?.security?.login_attempts > 14) {
        user.security.is_block = true;
        await this.usersRepository.save(user);
      }

      user.security.login_attempts = user.security.login_attempts
        ? user.security.login_attempts + 1
        : 1;
      user.security.device_try = deviceModel;
      await this.usersRepository.save(user);

      throw new CustomException(
        HttpStatus.UNAUTHORIZED,
        `Username or password is wrong`,
      );
    }

    await this.usersRepository.update(user.id, {
      security: {
        login_attempts: null,
        login_time: null,
        is_block: false,
      },
    });

    await this.deleteOldSession(user.devices);

    const tokens = await this.addDeviceAuth(deviceModel, user);

    return { ...user, ...tokens, password: null };
  }

  async signUpCredentials({
    email,
    password,
    userAgent,
    firstName,
    lastName,
  }: RegisterAuthDto & { userAgent: Details }): Promise<User & TokenType> {
    const userFound = await this.usersRepository.findOneBy({ email });
    if (userFound)
      throw new CustomException(
        HttpStatus.UNAUTHORIZED,
        `Such a user already exists`,
      );

    const deviceModel = `${userAgent.platform} ${userAgent.os} ${userAgent.browser}`;

    const hashPass = await hashPassword(password);

    const name = firstName
      ? firstName
      : `user${Math.floor(Math.random() * 90000) + 10000}`;

    const newUser = this.usersRepository.create({
      email,
      password: hashPass,
      firstName: name,
      lastName,
      actions: { timeAt: null, code: null, numberTries: 0 },
      settings: { profileDefault: null },
      security: {
        is_block: false,
        login_attempts: null,
        login_time: null,
      },
    });
    await this.usersRepository.save(newUser);

    const tokens = await this.addDeviceAuth(deviceModel, newUser);

    return { ...newUser, ...tokens, password: null };
  }

  async authGoogle(
    user: Pick<User, 'firstName' | 'lastName' | 'image' | 'email'>,
    userAgent: Details,
  ): Promise<User & TokenType> {
    const currentUser = await this.usersRepository.findOne({
      where: { email: user.email },
      relations: {
        devices: true,
      },
    });

    const deviceModel = `${userAgent.platform} ${userAgent.os} ${userAgent.browser}`;

    if (currentUser) {
      if (currentUser?.security?.is_block)
        throw new CustomException(423, `User blocked`);

      await this.deleteOldSession(currentUser.devices);

      const tokens = await this.addDeviceAuth(deviceModel, currentUser);

      return { ...currentUser, ...tokens, password: null };
    }

    if (!currentUser) {
      const hashPass = await hashPassword(uuidv4());
      const newUser = this.usersRepository.create({
        ...user,
        password: hashPass,
        actions: { timeAt: null, code: null, numberTries: 0 },
        settings: { profileDefault: null },
        security: {
          is_block: false,
          login_attempts: null,
          login_time: null,
        },
      });

      await this.usersRepository.save(newUser);

      const tokens = await this.addDeviceAuth(deviceModel, newUser);

      return { ...newUser, ...tokens, password: null };
    }
  }

  async refreshToken(
    user: User,
    currentDevice: UserDevices,
    userAgent: Details,
  ): Promise<TokenType> {
    const deviceModel = `${userAgent?.platform} ${userAgent?.os} ${userAgent?.browser}`;

    if (deviceModel !== currentDevice.deviceModel)
      throw new CustomException(
        HttpStatus.UNAUTHORIZED,
        `Login from an untrusted device`,
      );

    if (user?.security?.is_block)
      throw new CustomException(423, `User blocked`);

    const newTokens = this.createToken(user);

    const res = await this.devicesRepository.update(currentDevice.id, {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });

    console.log('updare-res', res);

    return newTokens;
  }

  async logout(currentDevice: UserDevices): Promise<void> {
    await this.devicesRepository.delete(currentDevice);
    return;
  }

  async restorePassword(key: string, password: string) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.firstName',
        'user.email',
        'user.actions',
        'user.security',
      ])
      .leftJoinAndSelect('user.devices', 'devices')
      .where(`user.actions @> :action`, { action: { code: key } })
      .getOne();

    if (!user)
      throw new CustomException(
        HttpStatus.BAD_REQUEST,
        `Incorrect or outdated link`,
      );
    if (user.security.is_block)
      throw new CustomException(
        423,
        `User is blocked. Contact customer support.`,
      );
    if (
      !user.actions.timeAt ||
      new Date().getTime() - new Date(user.actions.timeAt).getTime() >
        5 * 60 * 1000
    )
      throw new CustomException(
        HttpStatus.BAD_REQUEST,
        `The waiting time has expired. Your link is no longer valid.`,
      );

    return this.entityManager.transaction(async (transaction) => {
      const hashPass = await hashPassword(password);

      await transaction.update(User, user.id, {
        password: hashPass,
        actions: { timeAt: null, code: null, numberTries: 0 },
      });

      if (user.devices && user.devices.length)
        await transaction.delete(UserDevices, user.devices);

      return;
    });
  }

  async deleteOldSession(devices: UserDevices[]) {
    return Promise.all(
      devices.map(async (device) => {
        const decodedToken = await this.jwtService.decode(device.refreshToken);

        const currExp = decodedToken.exp * 1000;
        const currTime = new Date().getTime();

        if (currExp > currTime) return null;

        return await this.devicesRepository.delete(device);
      }),
    );
  }

  async addDeviceAuth(deviceModel: string, user: User): Promise<TokenType> {
    const tokens = this.createToken(user);
    const newDevice = this.devicesRepository.create({
      deviceModel: deviceModel ? deviceModel : null,
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    await this.devicesRepository.save(newDevice);

    return tokens;
  }

  createToken(user: User): TokenType {
    const payload = { email: user.email, id: user.id };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRE_ACCESS_TOKEN,
    });
    const refreshToken = this.jwtService.sign(payload);
    return { accessToken, refreshToken };
  }
}
