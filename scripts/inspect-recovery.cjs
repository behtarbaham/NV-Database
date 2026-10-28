const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('node:fs');
const path = require('node:path');
for (const file of [path.resolve('database/navand_academy.sqlite'), path.join(process.env.APPDATA, 'navand-course-manager/database/navand_academy.sqlite')]) {
  if (!fs.existsSync(file)) continue;
  const db = new Database(file,{ readonly:true, fileMustExist:true });
  const users=db.prepare('SELECT id,username,role FROM users').all();
  const recoveryExists=db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='password_recovery'").get();
  console.log(JSON.stringify({file,users,recovery:recoveryExists ? db.prepare('SELECT * FROM password_recovery').all().map(r=>({userId:r.user_id,temporary:r.is_temporary,acceptsRequestedCode:bcrypt.compareSync('02178004',r.code_hash)})) : [],flags:db.prepare("SELECT key,value FROM app_settings WHERE key LIKE '%recovery%'").all()}));
  db.close();
}
