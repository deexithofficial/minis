import { Router } from 'express';
import { signToken } from './jwt';
import { hashPassword, verifyPassword } from './password';
import { optionalGuestAuth } from '../middleware/requireAuth';
import {
  createGuestUser,
  createAccount,
  upgradeToAccount,
  findByEmail,
} from '../users/repo';
import { toPublicUser } from '../users/publicUser';

const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

export const authRouter = Router();

authRouter.post('/guest', async (_req, res, next) => {
  try {
    const user = await createGuestUser();
    const token = signToken({ sub: user.id, isGuest: true });
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/signup', optionalGuestAuth, async (req, res, next) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || !email || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Invalid email or password' });
    return;
  }

  try {
    const passwordHash = await hashPassword(password);

    let user;
    try {
      user = req.auth
        ? await upgradeToAccount(req.auth.id, email, passwordHash)
        : await createAccount(email, passwordHash);
    } catch (err) {
      if (isUniqueViolation(err)) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
      throw err;
    }

    const token = signToken({ sub: user.id, isGuest: false });
    res.status(200).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = await findByEmail(email);
    if (!user || !user.password_hash || !(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken({ sub: user.id, isGuest: user.is_guest });
    res.status(200).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});
