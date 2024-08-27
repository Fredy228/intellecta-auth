import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'lib-intellecta-entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomRMQException } from '../../services/custom-exception';

@Injectable()
export class ProtectService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async checkAuth(token: string): Promise<User> {
    if (!token)
      throw new CustomRMQException(HttpStatus.BAD_REQUEST, 'Not token');

    console.log('token', token);

    let decodedToken: { id: any };
    try {
      decodedToken = await this.jwtService.verify(token);
      console.log('decodedToken', decodedToken);
    } catch (error) {
      console.error(error);
      throw new CustomRMQException(HttpStatus.UNAUTHORIZED, 'Not authorized');
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

    console.log('user', currentUser);

    if (!currentUser)
      throw new CustomRMQException(HttpStatus.UNAUTHORIZED, 'Not authorized');

    return currentUser;
  }
}
