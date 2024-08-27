import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserDevices } from 'lib-intellecta-entity';

import { CustomException } from '../services/custom-exception';

@Injectable()
export class ProtectRefreshMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async use(
    req: Request & {
      user?: User;
      currentDevice: UserDevices;
    },
    _: Response,
    next: NextFunction,
  ) {
    const token = req.cookies.refreshToken;

    console.log('refreshToken', token);

    if (!token)
      throw new CustomException(HttpStatus.UNAUTHORIZED, 'Not authorized');

    let decodedToken: { id: any };
    try {
      decodedToken = await this.jwtService.verify(token);
      console.log('decodedToken', decodedToken);
    } catch (error) {
      console.error(error);
      throw new CustomException(HttpStatus.UNAUTHORIZED, 'Not authorized');
    }

    const currentUser = await this.usersRepository.findOne({
      where: { id: decodedToken.id },
      relations: {
        devices: true,
      },
      select: {
        id: true,
        email: true,
      },
    });
    console.log('user', currentUser);
    if (!currentUser)
      throw new CustomException(HttpStatus.UNAUTHORIZED, 'Not authorized');

    const currentDevice = currentUser.devices.find(
      (i) => i.refreshToken === token,
    );
    if (!currentDevice)
      throw new CustomException(HttpStatus.UNAUTHORIZED, 'Not authorized');

    req.user = currentUser;
    req.currentDevice = currentDevice;

    next();
  }
}
