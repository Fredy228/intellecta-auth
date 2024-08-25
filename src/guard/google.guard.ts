import { AuthGuard } from '@nestjs/passport';

class AuthGoogle extends AuthGuard('google') {
  constructor() {
    super({
      prompt: 'select_account',
    });
  }
}

export default AuthGoogle;
