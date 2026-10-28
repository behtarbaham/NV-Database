# Password recovery

The login screen includes **بازنشانی رمز عبور**.

Before forgetting a password, open **تغییر رمز**, enter the current password, and select **ساخت کد بازیابی جدید**. Save the displayed code somewhere safe. It is shown once; generating another code invalidates the previous code.

To reset a password, enter the username, recovery code, new password, and confirmation on the reset screen. The code is consumed when the password changes. Sign in and generate a new code afterward.

Recovery codes belong to the local database and travel with a database backup. Copying the installed application alone does not transfer accounts or recovery codes. Existing accounts must generate a code while their current password is known. A forgotten password without a previously generated recovery code cannot be reset through this form.

Codes are generated with cryptographic randomness, stored as bcrypt hashes, and limited to five failed attempts followed by a 15-minute lockout. Resetting preserves the username and academy data.

Validation uses an isolated temporary database. Run PowerShell:

```powershell
$env:ELECTRON_RUN_AS_NODE = '1'
try {
  & '.\node_modules\electron\dist\electron.exe' 'scripts/test-password-recovery.cjs'
} finally {
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
}
```

## One-time temporary recovery in version 0.2.2

The user-requested temporary code is 02178004. It is provisioned once for the sole local administrator when there is no existing personal recovery code. It is single-use and is never restored after use or after replacement with a personal code. Persian and Arabic digits are accepted. Multi-administrator databases keep their personal recovery workflow.

## Version 0.2.3

The user explicitly requested that 02178004 be reusable. For the sole local administrator, it remains valid after successful resets and application restart. Version 0.2.2 temporary codes are upgraded; consumed temporary codes can be reprovisioned once on upgrade. Personal codes are preserved. Generating a personal code disables the temporary code; personal codes remain single-use.

## Version 0.2.5

The temporary code targets the root administrator if present, including databases with several administrators. If root is absent, it targets the sole administrator. It does not reset other administrators. Personal recovery codes continue to replace it. The login and reset screens display the build version. Invisible direction markers in pasted recovery codes are ignored.
