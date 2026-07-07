/**
 * Fetch the better-sqlite3 native binary compiled for Electron's ABI.
 *
 * A normal `npm install` / `npm rebuild` compiles better_sqlite3.node against the
 * system Node.js ABI. Electron ships its own (different) ABI, so loading that build
 * inside Electron fails with "NODE_MODULE_VERSION mismatch". Run this after any
 * dependency install so the native module matches the Electron runtime.
 *
 * Usage: npm run rebuild:electron
 */
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const electronVersion = require(path.join(root, 'node_modules/electron/package.json')).version;
const betterSqliteDir = path.join(root, 'node_modules/better-sqlite3');
const prebuildBin = path.join(root, 'node_modules/prebuild-install/bin.js');

console.log(`Fetching better-sqlite3 prebuilt for Electron ${electronVersion}...`);

const result = spawnSync(
  process.execPath,
  [prebuildBin, '--runtime=electron', `--target=${electronVersion}`],
  { cwd: betterSqliteDir, stdio: 'inherit' },
);

if (result.status !== 0) {
  console.error('Failed to fetch the Electron-compatible better-sqlite3 binary.');
  process.exit(result.status || 1);
}

console.log('better-sqlite3 is now built for the Electron runtime.');
