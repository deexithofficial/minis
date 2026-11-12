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

usersRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    // Explicit allowlist: only these keys ever reach updateProfile.
    const patch: Parameters<typeof updateProfile>[1] = {};
    if (body.birthYear !== undefined) patch.birthYear = body.birthYear as number;
    if (body.interests !== undefined) patch.interests = body.interests as string[];
    if (body.characterLook !== undefined) patch.characterLook = body.characterLook as string;
    if (body.characterName !== undefined) patch.characterName = body.characterName as string;
    if (body.notificationsOptIn !== undefined) patch.notificationsOptIn = body.notificationsOptIn as boolean;

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
