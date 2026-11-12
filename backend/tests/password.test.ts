import { hashPassword, verifyPassword } from '../src/auth/password';

test('verifies a correct password and rejects a wrong one', async () => {
  const hash = await hashPassword('correct-horse-battery');
  expect(await verifyPassword('correct-horse-battery', hash)).toBe(true);
  expect(await verifyPassword('wrong-password', hash)).toBe(false);
});
