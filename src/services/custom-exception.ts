import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class CustomException extends HttpException {
  constructor(status: HttpStatus | number, message: string) {
    super(message, status);
  }
}

export function CustomRMQException(
  status: HttpStatus | number,
  message: string,
) {
  throw new RpcException({ statusCode: status, message: message });
}
