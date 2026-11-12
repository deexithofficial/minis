import { RequestHandler } from 'express';
import { verifyToken } from '../auth/jwt';

export interface AuthContext {
  id: string;
  isGuest: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function extractToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = extractToken(req.headers.authorization);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.auth = { id: payload.sub, isGuest: payload.isGuest };
  next();
};

export const optionalGuestAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req.headers.authorization);
  const payload = token ? verifyToken(token) : null;
  if (payload && payload.isGuest === true) {
    req.auth = { id: payload.sub, isGuest: payload.isGuest };
  }
  next();
};
