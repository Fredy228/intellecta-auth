import * as dotenv from 'dotenv';
import * as process from 'process';
import {
  User,
  UserDevices,
  Profile,
  Student,
  Teacher,
  Owner,
  Moderator,
  University,
  Faculty,
  Subject,
  Group,
  SupportMessage,
} from 'lib-intellecta-entity';
import { DataSource } from 'typeorm';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    UserDevices,
    Profile,
    Student,
    Teacher,
    Owner,
    Moderator,
    University,
    Subject,
    Faculty,
    Group,
    SupportMessage,
  ],
  // entities: [
  //   __dirname + '/node_modules/lib-intellecta-entity/dist/**/*.entity{.ts,.js}',
  // ],
  synchronize: false,
  logging: !Number(process.env.PRODUCTION),
  cache: false,
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });

export default AppDataSource;
