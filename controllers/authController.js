import { loginUser, updateUserCredentials } from '../models/authModel.js';
import { asyncHandler } from '../utils/errors.js';

export const postLogin = asyncHandler(async (req, res) => {
  const user = loginUser(req.body);
  res.json({ ok: true, user });
});

export const putCredentials = asyncHandler(async (req, res) => {
  const user = updateUserCredentials(req.body);
  res.json({ ok: true, user });
});
