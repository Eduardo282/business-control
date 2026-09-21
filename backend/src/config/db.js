import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  idleTimeout: 60000, // Tiempo en milisegundos (60 segundos). Si una conexión del pool pasa 1 minuto sin usarse, se cierra para liberar memoria en el servidor.
  queueLimit: 0, // Tamaño máximo de la fila de espera. 0 significa ilimitada (no rechaza peticiones por exceso de cola).
  waitForConnections: true,// Si ya hay 10 consultas ejecutándose al mismo tiempo, la 11ª se pone a esperar en fila en lugar de tirar un error.
  connectionLimit: 10, // Cantidad máxima de conexiones simultáneas abiertas hacia MySQL.
  namedPlaceholders: true, // Permite escribir consultas SQL usando parámetros con nombre (ej: :email) pasando un objeto { email: "test@..." }, en lugar de estar obligado a usar solo signos de interrogación posicionales (?).
});
