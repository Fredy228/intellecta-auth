import { Module } from '@nestjs/common';
import * as process from 'process';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import databaseConfig from './database/database.config';
import { AuthModule } from './controllers/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRE_REFRESH_TOKEN },
    }),
    AuthModule,
  ],
})
export class MainModule {}
