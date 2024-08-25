import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as process from 'process';
import { ALL_ENTITIES } from 'lib-intellecta-entity';

dotenv.config();

const config: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ALL_ENTITIES,
  synchronize: false,
  logging: !Number(process.env.PRODUCTION),
};

export default config;
