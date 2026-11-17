import { realpathSync } from 'fs';
import { pathToFileURL } from 'url';
import { runCli } from './cli';

export { TaxCalculator } from './services/tax-calculator';
export * from './types/tax.types';
export * from './constants/tax-values';
export * from './helpers/number';
export * from './utils/format';
export { runCli };

function isInvokedDirectly(): boolean {
  if (typeof process === 'undefined' || !Array.isArray(process.argv)) {
    return false;
  }

  if (process.argv.includes('--cli')) {
    return true;
  }

  const entryPath = process.argv[1];
  if (!entryPath) {
    return false;
  }

  try {
    return import.meta.url === pathToFileURL(realpathSync(entryPath)).href;
  } catch {
    return false;
  }
}

if (isInvokedDirectly()) {
  runCli().catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Error fatal:', error);
    process.exit(1);
  });
}
