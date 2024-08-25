import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as process from 'process';
import * as cookieParser from 'cookie-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { MainModule } from './main.module';
import { HttpExceptionFilter } from './error/http-exception.filter';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MainModule, {
    logger: ['error', 'warn', 'log'],
    cors: {
      origin: [process.env.CLIENT_URL, 'http://localhost:3000'],
      credentials: true,
    },
  });

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Intellecta')
    .setDescription('The auth API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const PORT = process.env.PORT || 3333;

  await app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'auth_queue',
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservices();
}
bootstrap();
