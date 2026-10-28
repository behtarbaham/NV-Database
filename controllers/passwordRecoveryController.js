import { createRecoveryCode, resetPassword, registerAccount } from '../models/passwordRecoveryModel.js';
import { asyncHandler } from '../utils/errors.js';

export const postRecoveryCode = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...createRecoveryCode(req.body) });
});

export const postResetPassword = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...resetPassword(req.body) });
});

export const postRegisterAccount = asyncHandler(async (req, res) => {
  const user = registerAccount(req.body);
  res.status(201).json({ ok: true, user });
});
