import pino from 'pino';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '{msg}',
    },
  },
  level: LOG_LEVEL,
});
