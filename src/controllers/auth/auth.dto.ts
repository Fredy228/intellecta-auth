import { ApiProperty } from '@nestjs/swagger';

export class LoginAuthDto {
  @ApiProperty({ required: true })
  email: string;

  @ApiProperty()
  password: string;
}

export class RegisterAuthDto {
  @ApiProperty({ required: true })
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  password: string;
}

export class TokenDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

export class RestorePassDto {
  @ApiProperty()
  password: string;
}
