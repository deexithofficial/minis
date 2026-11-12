import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/db';

beforeEach(async () => { await pool.query('DELETE FROM users'); });
afterAll(async () => { await pool.end(); });

test('POST /auth/guest creates a guest and returns a usable token', async () => {
  const res = await request(app).post('/auth/guest');
  expect(res.status).toBe(201);
  expect(res.body.user.isGuest).toBe(true);
  expect(typeof res.body.token).toBe('string');
});

test('POST /auth/signup with a valid guest token upgrades the same user', async () => {
  const guest = await request(app).post('/auth/guest');
  const signup = await request(app)
    .post('/auth/signup')
    .set('Authorization', `Bearer ${guest.body.token}`)
    .send({ email: 'player@example.com', password: 'longenough' });
  expect(signup.status).toBe(200);
  expect(signup.body.user.id).toBe(guest.body.user.id);
  expect(signup.body.user.isGuest).toBe(false);
});

test('POST /auth/signup with a garbage Authorization header still creates a fresh account', async () => {
  const res = await request(app)
    .post('/auth/signup')
    .set('Authorization', 'Bearer not-a-real-token')
    .send({ email: 'fresh@example.com', password: 'longenough' });
  expect(res.status).toBe(200);
  expect(res.body.user.isGuest).toBe(false);
});

test('POST /auth/signup rejects a duplicate email regardless of case', async () => {
  await request(app).post('/auth/signup').send({ email: 'dup@example.com', password: 'longenough' });
  const res = await request(app).post('/auth/signup').send({ email: 'DUP@example.com', password: 'longenough' });
  expect(res.status).toBe(409);
  expect(res.body.error).toBe('Email already in use');
});

test('POST /auth/signup rejects a short password', async () => {
  const res = await request(app).post('/auth/signup').send({ email: 'short@example.com', password: 'short' });
  expect(res.status).toBe(400);
});

test('POST /auth/signup gives a field-specific message for a missing email', async () => {
  const res = await request(app).post('/auth/signup').send({ password: 'longenough' });
  expect(res.status).toBe(400);
  expect(res.body.error).toBe('Email is required');
});

test('POST /auth/signup gives a field-specific message for a too-short password', async () => {
  const res = await request(app).post('/auth/signup').send({ email: 'fieldcheck@example.com', password: 'short' });
  expect(res.status).toBe(400);
  expect(res.body.error).toBe('Password must be at least 8 characters');
});

test('POST /auth/signup rejects a whitespace-only email', async () => {
  const res = await request(app).post('/auth/signup').send({ email: '   ', password: 'longenough' });
  expect(res.status).toBe(400);
  expect(res.body.error).toBe('Email is required');
});

test('POST /auth/signup rejects an email with no @', async () => {
  const res = await request(app).post('/auth/signup').send({ email: 'not-an-email', password: 'longenough' });
  expect(res.status).toBe(400);
});

test('a stale guest token cannot be replayed to overwrite an already-upgraded account', async () => {
  const guest = await request(app).post('/auth/guest');
  const guestToken = guest.body.token as string;

  const firstSignup = await request(app)
    .post('/auth/signup')
    .set('Authorization', `Bearer ${guestToken}`)
    .send({ email: 'original@example.com', password: 'first-password' });
  expect(firstSignup.status).toBe(200);

  // Replay the SAME (still-unexpired) guest token with different credentials.
  const replay = await request(app)
    .post('/auth/signup')
    .set('Authorization', `Bearer ${guestToken}`)
    .send({ email: 'attacker@example.com', password: 'second-password' });
  expect(replay.status).toBe(409);
  expect(replay.body.error).toBe('Account already registered');

  // The original account's credentials must be untouched: the first email/password still work...
  const loginAsOriginal = await request(app)
    .post('/auth/login')
    .send({ email: 'original@example.com', password: 'first-password' });
  expect(loginAsOriginal.status).toBe(200);

  // ...and the attacker's email was never attached to any account.
  const loginAsAttacker = await request(app)
    .post('/auth/login')
    .send({ email: 'attacker@example.com', password: 'second-password' });
  expect(loginAsAttacker.status).toBe(401);
});

test('POST /auth/login with a missing password returns 400, not 401', async () => {
  const res = await request(app).post('/auth/login').send({ email: 'someone@example.com' });
  expect(res.status).toBe(400);
});

test('POST /auth/login succeeds with the right password and fails with the wrong one', async () => {
  await request(app).post('/auth/signup').send({ email: 'login@example.com', password: 'longenough' });
  const ok = await request(app).post('/auth/login').send({ email: 'login@example.com', password: 'longenough' });
  expect(ok.status).toBe(200);
  const bad = await request(app).post('/auth/login').send({ email: 'login@example.com', password: 'wrong-pass' });
  expect(bad.status).toBe(401);
});
