import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const electronPath = require('electron');
const args = process.argv.slice(2);
const env = { ...process.env };

delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, args.length > 0 ? args : ['.'], {
  stdio: 'inherit',
  env,
  windowsHide: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
