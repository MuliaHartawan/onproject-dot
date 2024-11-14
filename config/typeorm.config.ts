import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const getDatabaseDataSourceOptions = ({
  port,
  host,
  username,
  database,
  password,
}): DataSourceOptions => {
  return {
    type: 'mysql',
    port,
    host,
    username,
    database,
    password: password,
    entities: [join(__dirname, '../', '**', '*.entity.{ts,js}')],
  };
};

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '../', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '../src/migrations/*.{ts,js}')],
  synchronize: true,
  logging: true,
};

export const DatabaseSource = new DataSource({
  ...getDatabaseDataSourceOptions(typeOrmConfig as any),
});
