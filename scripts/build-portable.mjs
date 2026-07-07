import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const releaseDir = path.join(root, 'release');
const portableDir = path.join(releaseDir, 'Navand Course Manager-win32-x64');
const appDir = path.join(portableDir, 'resources', 'app');

const copy = (from, to) => {
  fs.cpSync(from, to, {
    recursive: true,
    force: true,
    filter: (source) => {
      const normalized = source.replaceAll(path.sep, '/');
      return ![
        '/node_modules/.cache/',
        '/database/backups/',
        '/logs/',
        '/release/',
      ].some((part) => normalized.includes(part))
        && !normalized.endsWith('.sqlite')
        && !normalized.endsWith('.sqlite-shm')
        && !normalized.endsWith('.sqlite-wal')
        && !normalized.endsWith('.mp4');
    },
  });
};

fs.mkdirSync(releaseDir, { recursive: true });
fs.rmSync(portableDir, { recursive: true, force: true });

const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const build = spawnSync(process.execPath, [viteBin, 'build', '--config', 'frontend/vite.config.ts'], {
  cwd: root,
  stdio: 'inherit',
});
if (build.status !== 0) process.exit(build.status || 1);

const electronPackagePath = require.resolve('electron/package.json');
const electronDist = path.join(path.dirname(electronPackagePath), 'dist');
copy(electronDist, portableDir);

const sourceExe = path.join(portableDir, 'electron.exe');
const targetExe = path.join(portableDir, 'Navand Course Manager.exe');
fs.renameSync(sourceExe, targetExe);

fs.rmSync(path.join(portableDir, 'resources', 'default_app.asar'), { force: true });
fs.mkdirSync(appDir, { recursive: true });

[
  'config',
  'controllers',
  'dist',
  'electron',
  'models',
  'services',
  'utils',
].forEach((entry) => copy(path.join(root, entry), path.join(appDir, entry)));

fs.mkdirSync(path.join(appDir, 'database'), { recursive: true });
copy(path.join(root, 'database', 'sqlite.js'), path.join(appDir, 'database', 'sqlite.js'));
copy(path.join(root, 'package.json'), path.join(appDir, 'package.json'));
copy(path.join(root, 'package-lock.json'), path.join(appDir, 'package-lock.json'));
copy(path.join(root, 'node_modules'), path.join(appDir, 'node_modules'));

const packageJsonPath = path.join(appDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.scripts = {};
packageJson.devDependencies = {};
delete packageJson.build;
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

const npmCli = process.env.npm_execpath;
const prune = npmCli ? spawnSync(process.execPath, [
  npmCli,
  'prune',
  '--omit=dev',
  '--ignore-scripts',
], {
  cwd: appDir,
  stdio: 'inherit',
}) : spawnSync('npm', ['prune', '--omit=dev', '--ignore-scripts'], {
  cwd: appDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (prune.status !== 0) process.exit(prune.status || 1);

console.log(`Portable app created at ${portableDir}`);
