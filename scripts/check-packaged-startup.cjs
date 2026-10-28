const { app } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const testRoot = path.resolve(__dirname, '../.tmp/startup-023');
fs.mkdirSync(testRoot, { recursive: true });
app.setPath('userData', testRoot);
Object.defineProperty(app, 'isPackaged', { value: true });
const report = (data) => fs.writeFileSync(path.join(testRoot, 'result.json'), JSON.stringify(data, null, 2));
const timer = setTimeout(() => { report({ ok: false, reason: 'startup timeout' }); app.exit(1); }, 120000);
app.on('browser-window-created', (_event, win) => {
  win.webContents.once('did-finish-load', async () => {
    try {
      const result = await win.webContents.executeJavaScript(`new Promise(resolve => setTimeout(() => resolve({
        title: document.title,
        text: document.body.innerText,
        inputs: document.querySelectorAll('input').length,
        ipcAvailable: Boolean(window.navandApi?.resetPassword)
      }), 1500))`);
      const recoveryResult = await win.webContents.executeJavaScript(`(async () => {
        const reset = [...document.querySelectorAll('button')].find(button => button.innerText.includes('بازنشانی'));
        if (!reset) throw new Error('Missing reset button');
        reset.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        const inputs = [...document.querySelectorAll('input')].filter(input => input.type !== 'checkbox');
        const values = ['root', '02178004', '1234', '1234'];
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        for (let i = 0; i < inputs.length; i++) {
          setter.call(inputs[i], values[i]);
          inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { resetSuccess: document.body.innerText.includes('رمز عبور تغییر کرد'), resetText: document.body.innerText };
      })()`);
      report({ ok: result.inputs >= 2 && result.ipcAvailable && recoveryResult.resetSuccess, ...result, ...recoveryResult });
      clearTimeout(timer);
      app.quit();
    } catch (error) { report({ ok: false, reason: error.message }); clearTimeout(timer); app.exit(1); }
  });
  win.webContents.once('did-fail-load', (_event, code, description) => { report({ok: false, code, description}); clearTimeout(timer); app.exit(1); });
});
require(path.resolve(__dirname, '../release/win-unpacked/resources/app.asar/electron/main.cjs'));
