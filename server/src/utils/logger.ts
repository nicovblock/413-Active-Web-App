import { LoggingWinston } from '@google-cloud/logging-winston';
import winston from 'winston';

const transports: winston.transport[] = [new winston.transports.Console()];

if (process.env.NODE_ENV === 'production') {
  transports.push(new LoggingWinston());
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports
});
