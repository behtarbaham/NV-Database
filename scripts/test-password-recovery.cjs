// Run with Electron's Node mode so SQLite uses the same ABI as the desktop app.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const tempRoot = fs.realpathSync(os.tmpdir());
const testDir = fs.mkdtempSync(path.join(tempRoot, 'navand-recovery-test-'));
process.env.DATABASE_PATH = path.join(testDir, 'test.sqlite');
process.env.LOG_DIR = path.join(testDir, 'logs');
process.env.BACKUP_DIR = path.join(testDir, 'backups');
process.env.BCRYPT_ROUNDS = '4';
const appRoot = process.env.NAVAND_TEST_APP_ROOT || path.resolve(__dirname, '..');
const load = (name) => import(pathToFileURL(path.resolve(appRoot, name)).href);

(async () => {
  let database;
  let server;
  try {
    database = await load('database/sqlite.js');
    const auth = await load('models/authModel.js');
    const recovery = await load('models/passwordRecoveryModel.js');
    database.initializeDatabase();
    let db = database.getDb();
    const user = auth.loginUser({ username: 'root', password: '1234' });
    const otherAdmin = auth.registerUser({ username: 'other-admin', password: 'other-password' });
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('recovery_test_data', 'preserve-me')").run();
    assert.throws(() => recovery.createRecoveryCode({ username: 'root', currentPassword: 'wrong' }), /رمز فعلی/);
    assert.throws(() => recovery.resetPassword({ username: 'root', recoveryCode: '02178005', password: 'wrong-reset' }), /کد بازیابی/);
    assert.throws(() => recovery.resetPassword({ username: 'other-admin', recoveryCode: '02178004', password: 'wrong-reset' }));
    recovery.resetPassword({ username: 'root', recoveryCode: '\u200e۰۲۱۷۸۰۰۴\u200e', password: '1234' });
    assert.equal(auth.loginUser({ username: 'root', password: '1234' }).id, user.id);
    database.closeDb();
    database.initializeDatabase();
    db = database.getDb();
    recovery.resetPassword({ username: 'root', recoveryCode: '02178004', password: 'second-reset' });
    assert.equal(auth.loginUser({ username: 'root', password: 'second-reset' }).id, user.id);
    recovery.resetPassword({ username: 'root', recoveryCode: '02178004', password: '1234' });
    assert.equal(auth.loginUser({ username: 'root', password: '1234' }).id, user.id);
    const first = recovery.createRecoveryCode({ username: 'root', currentPassword: '1234' }).recoveryCode;
    assert.throws(() => recovery.resetPassword({ username: 'root', recoveryCode: '02178004', password: 'wrong-reset' }), /کد بازیابی/);
    assert.match(first, /^[A-F0-9]{4}(?:-[A-F0-9]{4}){7}$/);
    assert.notEqual(db.prepare('SELECT code_hash FROM password_recovery').get().code_hash, first);
    const second = recovery.createRecoveryCode({ username: 'root', currentPassword: '1234' }).recoveryCode;
    assert.throws(() => recovery.resetPassword({ username: 'root', recoveryCode: first, password: 'new-password' }), /کد بازیابی/);
    assert.throws(() => recovery.resetPassword({ username: 'missing', recoveryCode: second, password: 'new-password' }), /کد بازیابی/);
    assert.throws(() => recovery.resetPassword({ username: 'root', recoveryCode: second, password: '123' }), /رمز جدید/);
    assert.throws(() => recovery.resetPassword({ username: 'root', recoveryCode: second, password: 'x'.repeat(73) }), /رمز جدید/);
    // Persist and reopen to cover desktop restart / a restored database.
    database.closeDb();
    recovery.resetPassword({ username: ' ROOT ', recoveryCode: second.replaceAll('-', ' ').toLowerCase(), password: 'new-password' });
    assert.throws(() => auth.loginUser({ username: 'root', password: '1234' }), /Invalid username/);
    assert.equal(auth.loginUser({ username: 'root', password: 'new-password' }).id, user.id);
    assert.throws(() => recovery.resetPassword({ username: 'root', recoveryCode: second, password: 'another-password' }), /کد بازیابی/);
    database.initializeDatabase();
    assert.equal(auth.loginUser({ username: 'root', password: 'new-password' }).id, user.id);
    assert.equal(database.getDb().prepare("SELECT value FROM app_settings WHERE key = 'recovery_test_data'").get().value, 'preserve-me');
    const third = recovery.createRecoveryCode({ username: 'root', currentPassword: 'new-password' }).recoveryCode;
    for (let i = 0; i < 5; i++) {
      assert.throws(() => recovery.resetPassword({ username: 'root', recoveryCode: 'bad', password: 'another-password' }), /کد بازیابی/);
    }
    assert.throws(() => recovery.resetPassword({ username: 'root', recoveryCode: third, password: 'another-password' }), /۱۵ دقیقه/);
    database.getDb().prepare('UPDATE password_recovery SET locked_until = ?').run(Date.now() - 1);
    recovery.resetPassword({ username: 'root', recoveryCode: third, password: 'another-password' });
    assert.equal(auth.loginUser({ username: 'root', password: 'another-password' }).id, user.id);
    const { createServer } = await load('services/serverService.js');
    server = createServer().listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const post = (route, body) => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const response = await post('/api/auth/recovery-code', { username: 'root', currentPassword: 'another-password' });
    assert.equal(response.status, 200);
    const result = await response.json();
    const invalid = await post('/api/auth/reset-password', { username: 'root', recoveryCode: 'bad', password: 'http-password' });
    assert.equal(invalid.status, 401);
    const valid = await post('/api/auth/reset-password', { username: 'root', recoveryCode: result.recoveryCode, password: 'http-password' });
    assert.equal(valid.status, 200);
    assert.equal(auth.loginUser({ username: 'root', password: 'http-password' }).id, user.id);
    // Upgrade from 0.2.2: old schema, already-consumed temporary code.
    const upgradeDb = database.getDb();
    upgradeDb.exec('DROP TABLE password_recovery');
    upgradeDb.exec('CREATE TABLE password_recovery (user_id INTEGER PRIMARY KEY REFERENCES users(id), code_hash TEXT NOT NULL, failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER NOT NULL DEFAULT 0)');
    upgradeDb.prepare('DELETE FROM app_settings WHERE key = ?').run('reusable_admin_recovery_023');
    recovery.resetPassword({ username: 'root', recoveryCode: '02178004', password: 'upgraded-password' });
    assert.equal(auth.loginUser({ username: 'root', password: 'upgraded-password' }).id, user.id);
    recovery.resetPassword({ username: 'root', recoveryCode: '02178004', password: 'upgraded-again' });
    assert.equal(auth.loginUser({ username: 'root', password: 'upgraded-again' }).id, user.id);
    const personal = recovery.createRecoveryCode({ username: 'root', currentPassword: 'upgraded-again' }).recoveryCode;
    upgradeDb.prepare('DELETE FROM app_settings WHERE key = ?').run('reusable_admin_recovery_023');
    assert.throws(() => recovery.resetPassword({ username: 'root', recoveryCode: '02178004', password: 'wrong-reset' }));
    recovery.resetPassword({ username: 'root', recoveryCode: personal, password: 'personal-preserved' });
    assert.equal(auth.loginUser({ username: 'root', password: 'personal-preserved' }).id, user.id);
    console.log('Password recovery checks passed: reusable temporary code, multiple admins, pasted code, legacy upgrade, generation, rotation, invalid inputs, persistence, personal-code single use, lockout, data preservation, HTTP endpoints.');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (database) database.closeDb();
    const resolvedDir = fs.realpathSync(testDir);
    if (path.dirname(resolvedDir) !== tempRoot || !path.basename(resolvedDir).startsWith('navand-recovery-test-')) {
      throw new Error('Refusing cleanup outside the temporary test directory');
    }
    fs.rmSync(resolvedDir, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
