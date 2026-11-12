import { apiRequest, ApiError } from '../client';

beforeEach(() => { global.fetch = jest.fn(); });

test('returns parsed JSON on success and sends the Authorization header when a token is given', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ hello: 'world' }) });
  const result = await apiRequest('/ping', { token: 'abc' });
  expect(result).toEqual({ hello: 'world' });
  const [, init] = (global.fetch as jest.Mock).mock.calls[0];
  expect(init.headers.Authorization).toBe('Bearer abc');
});

test('throws ApiError with the server message on a JSON error body', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'Email already in use' }) });
  await expect(apiRequest('/x')).rejects.toMatchObject(new ApiError(409, 'Email already in use'));
});

test('falls back to a generic message when the error body is not JSON', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error('not json'); } });
  await expect(apiRequest('/x')).rejects.toMatchObject(new ApiError(500, 'Request failed'));
});
