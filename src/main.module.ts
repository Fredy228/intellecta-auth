import { Module } from '@nestjs/common';
import * as process from 'process';
import * as dotenv from 'dotenv';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import databaseConfig from './database/database.config';
import { AuthModule } from './controllers/auth/auth.module';
import { ProtectModule } from './controllers/protect/protect.module';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRE_REFRESH_TOKEN },
    }),
    AuthModule,
    ProtectModule,
  ],
})
export class MainModule {}
