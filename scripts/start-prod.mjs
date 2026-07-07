/**
 * Launch the packaged desktop app: build the frontend, then start Electron with
 * NODE_ENV=production so it loads the built dist/index.html (file://) instead of
 * the Vite dev server. dotenv does not override variables already set here, so
 * this wins over NODE_ENV=development in .env.
 *
 * Usage: npm run start:prod
 */
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Invoke vite's JS bin with the Node binary directly. Spawning npm.cmd would
// require shell:true on Windows/Node and is brittle; this is portable.
const viteBin = path.join(root, 'node_modules/vite/bin/vite.js');
const build = spawnSync(
  process.execPath,
  [viteBin, 'build', '--config', 'frontend/vite.config.ts'],
  { cwd: root, stdio: 'inherit' },
);
if (build.status !== 0) process.exit(build.status || 1);

const electronExe = require('electron'); // resolves to the platform binary path

// Strip ELECTRON_RUN_AS_NODE: if it is set (it is when launched from inside an
// Electron host such as VS Code), electron.exe runs as a plain Node process and
// exits immediately instead of opening the desktop window.
const env = { ...process.env, NODE_ENV: 'production' };
delete env.ELECTRON_RUN_AS_NODE;

const run = spawnSync(electronExe, ['.'], { cwd: root, stdio: 'inherit', env });
process.exit(run.status || 0);
