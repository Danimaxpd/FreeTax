#!/usr/bin/env node
import { spawn } from 'child_process';

const rawArgs = process.argv.slice(2);
const isCliToken = (arg) => arg.toLowerCase() === 'cli' || arg === '--cli' || arg === '-c';
const isCliMode = rawArgs.some(isCliToken);
const remainingArgs = rawArgs.filter((arg) => !isCliToken(arg));

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
