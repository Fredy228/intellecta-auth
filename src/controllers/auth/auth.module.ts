import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { User, UserDevices } from 'lib-intellecta-entity';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ProtectRefreshMiddleware } from '../../middlewares/protect-refresh.middleware';
import { UserAgentMiddleware } from '../../middlewares/user-agent.middleware';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserDevices]),
    PassportModule.register({
      defaultStrategy: 'google',
      prompt: 'select_account',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
  exports: [PassportModule],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProtectRefreshMiddleware).forRoutes(
      {
        path: '/auth/refresh',
        method: RequestMethod.GET,
      },
      {
        path: '/auth/logout',
        method: RequestMethod.GET,
      },
    );

    consumer.apply(UserAgentMiddleware).forRoutes(
      {
        path: '/auth/google/callback',
        method: RequestMethod.GET,
      },
      {
        path: '/auth/register',
        method: RequestMethod.POST,
      },
      {
        path: '/auth/login',
        method: RequestMethod.POST,
      },
      {
        path: '/auth/refresh',
        method: RequestMethod.GET,
      },
    );
  }
}
