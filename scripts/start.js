import { spawn } from 'child_process';

const rawArgs = process.argv.slice(2);
const isCliMode = rawArgs.some((arg) => arg === '--cli' || arg === '-c');
const remainingArgs = rawArgs.filter((arg) => arg !== '--cli' && arg !== '-c');

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const commandArgs = isCliMode
  ? ['tsx', '-r', 'dotenv/config', 'src/cli.ts', ...remainingArgs]
  : ['vite', '--open', ...remainingArgs];

const child = spawn(npxCmd, commandArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

child.on('error', (error) => {
  console.error('Error al iniciar la aplicación:', error.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
