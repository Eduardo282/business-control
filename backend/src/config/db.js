import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  idleTimeout: 60000,
  queueLimit: 0,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});
