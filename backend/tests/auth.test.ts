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

test('POST /auth/login succeeds with the right password and fails with the wrong one', async () => {
  await request(app).post('/auth/signup').send({ email: 'login@example.com', password: 'longenough' });
  const ok = await request(app).post('/auth/login').send({ email: 'login@example.com', password: 'longenough' });
  expect(ok.status).toBe(200);
  const bad = await request(app).post('/auth/login').send({ email: 'login@example.com', password: 'wrong-pass' });
  expect(bad.status).toBe(401);
});
