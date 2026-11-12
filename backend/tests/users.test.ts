import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/db';

beforeEach(async () => { await pool.query('DELETE FROM users'); });
afterAll(async () => { await pool.end(); });

async function guestToken() {
  const res = await request(app).post('/auth/guest');
  return res.body.token as string;
}

test('GET /users/me requires auth', async () => {
  const res = await request(app).get('/users/me');
  expect(res.status).toBe(401);
});

test('PATCH /users/me applies a partial update without clearing earlier fields', async () => {
  const token = await guestToken();
  await request(app).patch('/users/me').set('Authorization', `Bearer ${token}`).send({ interests: ['Runner'] });
  const res = await request(app).patch('/users/me').set('Authorization', `Bearer ${token}`).send({ birthYear: 2000 });
  expect(res.status).toBe(200);
  expect(res.body.interests).toEqual(['Runner']);
  expect(res.body.birthYear).toBe(2000);
});

test('PATCH /users/me ignores unknown keys', async () => {
  const token = await guestToken();
  const res = await request(app).patch('/users/me').set('Authorization', `Bearer ${token}`).send({ notARealField: 'x', birthYear: 1999 });
  expect(res.status).toBe(200);
  expect(res.body.birthYear).toBe(1999);
});
