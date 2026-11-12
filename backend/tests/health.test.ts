import request from 'supertest';
import { app } from '../src/app';

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok' });
});

test('malformed JSON body returns 400, not 500', async () => {
  const res = await request(app)
    .post('/auth/guest')
    .set('Content-Type', 'application/json')
    .send('{bad');
  expect(res.status).toBe(400);
  expect(res.body.error).toBe('Malformed JSON');
});
