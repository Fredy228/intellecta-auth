import { Module } from '@nestjs/common';
import { ProtectService } from './protect.service';
import { ProtectController } from './protect.controller';
import { User } from 'lib-intellecta-entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [ProtectService],
  controllers: [ProtectController],
})
export class ProtectModule {}
