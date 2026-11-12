import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { findById, updateProfile } from './repo';
import { toPublicUser } from './publicUser';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const row = await findById(req.auth!.id);
    if (!row) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json(toPublicUser(row));
  } catch (err) {
    next(err);
  }
});

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

usersRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    // Explicit allowlist: only these keys ever reach updateProfile.
    const patch: Parameters<typeof updateProfile>[1] = {};

    if (body.birthYear !== undefined) {
      if (!Number.isInteger(body.birthYear)) {
        res.status(400).json({ error: 'birthYear is invalid' });
        return;
      }
      patch.birthYear = body.birthYear as number;
    }
    if (body.interests !== undefined) {
      if (!isStringArray(body.interests)) {
        res.status(400).json({ error: 'interests is invalid' });
        return;
      }
      patch.interests = body.interests;
    }
    if (body.characterLook !== undefined) {
      if (typeof body.characterLook !== 'string' && body.characterLook !== null) {
        res.status(400).json({ error: 'characterLook is invalid' });
        return;
      }
      patch.characterLook = body.characterLook as string | null;
    }
    if (body.characterName !== undefined) {
      if (typeof body.characterName !== 'string' && body.characterName !== null) {
        res.status(400).json({ error: 'characterName is invalid' });
        return;
      }
      patch.characterName = body.characterName as string | null;
    }
    if (body.notificationsOptIn !== undefined) {
      if (typeof body.notificationsOptIn !== 'boolean') {
        res.status(400).json({ error: 'notificationsOptIn is invalid' });
        return;
      }
      patch.notificationsOptIn = body.notificationsOptIn;
    }

    const row = await updateProfile(req.auth!.id, patch);
    if (!row) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.status(200).json(toPublicUser(row));
  } catch (err) {
    next(err);
  }
});
