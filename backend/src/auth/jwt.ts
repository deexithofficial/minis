import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET is not set');
}

export interface TokenPayload {
  sub: string;
  isGuest: boolean;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret as string, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret as string) as jwt.JwtPayload;
    return { sub: decoded.sub as string, isGuest: decoded.isGuest as boolean };
  } catch {
    return null;
  }
}
