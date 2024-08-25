import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from 'lib-intellecta-entity';
import { RoleEnum } from 'lib-intellecta-entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (roles.length === 0) {
      return true;
    }

    const request: Request & { user: User } = context
      .switchToHttp()
      .getRequest();

    const profiles = request?.user?.profiles;
    if (!profiles || !profiles.length) return false;

    const foundProfile = profiles.find((item) => {
      return roles.includes(item.role) || roles.includes(RoleEnum.MAKER);
    });

    console.log('foundProfile', foundProfile);

    return !!foundProfile;
  }
}
