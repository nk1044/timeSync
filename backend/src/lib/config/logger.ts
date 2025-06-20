import pino from 'pino';
import { join } from 'path';
import { mkdirSync } from 'fs';

mkdirSync(join(process.cwd(), 'logs'), { recursive: true });

export const logger = pino({
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        options: { colorize: true },
        level: 'info',
      },
      {
        target: 'pino/file',
        options: { destination: './logs/app.log', mkdir: true },
        level: 'info',
      },
    ],
  },
});
