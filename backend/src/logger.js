import pino from 'pino';
import { config } from './config.js';

// The shared logger — use it instead of console.log
export const logger = pino({ level: config.LOG_LEVEL });
