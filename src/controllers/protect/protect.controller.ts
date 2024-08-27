import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'lib-intellecta-entity';

import { ProtectService } from './protect.service';

@Controller('protect')
export class ProtectController {
  constructor(private readonly protectService: ProtectService) {}

  @MessagePattern({ cmd: 'check-auth' })
  async checkAuthorization(@Payload() event: { token: string }): Promise<User> {
    return this.protectService.checkAuth(event.token);
  }
}
