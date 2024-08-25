import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from 'lib-intellecta-entity';

import { CustomException } from './custom-exception';

@Injectable()
export class AuthMiddlewareService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  checkAccessToken(authorization: string | undefined): string {
    return authorization?.startsWith('Bearer') && authorization?.split(' ')[1];
  }

  async findUser(token: string): Promise<User> {
    let decodedToken: { id: any };
    try {
      decodedToken = await this.jwtService.verify(token);
      console.log('decodedToken', decodedToken);
    } catch (error) {
      throw new CustomException(HttpStatus.UNAUTHORIZED, 'Not authorized');
    }

    const currentUser = await this.usersRepository.findOne({
      where: {
        id: decodedToken.id,
      },
      relations: {
        profiles: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        image: true,
        email: true,
        verified: true,
        settings: {},
        security: {},
        profiles: {
          id: true,
          role: true,
          title: true,
        },
      },
    });

    if (!currentUser)
      throw new CustomException(HttpStatus.UNAUTHORIZED, 'Not authorized');

    return currentUser;
  }
}
