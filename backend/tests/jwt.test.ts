import { signToken, verifyToken } from '../src/auth/jwt';

test('round-trips a valid token', () => {
  const token = signToken({ sub: 'abc-123', isGuest: true });
  expect(verifyToken(token)).toEqual({ sub: 'abc-123', isGuest: true });
});

test('returns null for a malformed token', () => {
  expect(verifyToken('not-a-token')).toBeNull();
});
