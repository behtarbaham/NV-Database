# Account registration (0.3.0)

Choose ساخت حساب جدید و کد بازیابی on the login screen. Enter a username, password (at least six characters), and your own eight-digit recovery code. Confirm both password and code. Account and recovery hash are saved together in one transaction.

After creating the account, record the displayed recovery code, acknowledge that you saved it, and return to login. Sign in using the username and password you selected.

Recovery belongs to that account. Use the chosen code and the same username to reset the password. A personal code is single-use; after recovery generate another code from the change-account screen. Existing accounts, academy records, default-account initialization and previously configured recovery behaviors are preserved.

Accounts are local to each computer. Use database backup and restore to move accounts and academy records together.

Validation: scripts/test-account-registration.cjs with Electron Node mode and an isolated temporary database.
