import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomException extends HttpException {
  constructor(status: HttpStatus | number, message: string) {
    super(message, status);
  }
}
