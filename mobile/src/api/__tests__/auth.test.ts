import { apiRequest } from '../client';
import { guestSignIn, signup, login } from '../auth';

jest.mock('../client');

test('signup sends the guest token as the bearer token when provided', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ token: 't', user: {} });
  await signup({ email: 'a@b.com', password: 'longenough', guestToken: 'g-tok' });
  expect(apiRequest).toHaveBeenCalledWith('/auth/signup', { method: 'POST', body: { email: 'a@b.com', password: 'longenough' }, token: 'g-tok' });
});

test('guestSignIn posts with no body', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ token: 't', user: {} });
  await guestSignIn();
  expect(apiRequest).toHaveBeenCalledWith('/auth/guest', { method: 'POST' });
});
