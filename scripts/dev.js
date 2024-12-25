import { spawn } from 'child_process';
import { platform } from 'os';

const isWindows = platform() === 'win32';

const command = isWindows
  ? `set NODE_OPTIONS=--loader ts-node/esm && node src/index.ts`
  : `NODE_OPTIONS='--loader ts-node/esm' node src/index.ts`;

spawn(command, {
  stdio: 'inherit',
  shell: true,
}); 