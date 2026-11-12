import { pool } from '../src/db';
import { createGuestUser, findById, findByEmail, upgradeToAccount, updateProfile } from '../src/users/repo';

beforeEach(async () => { await pool.query('DELETE FROM users'); });
afterAll(async () => { await pool.end(); });

test('creates a guest user and finds it by id', async () => {
  const user = await createGuestUser();
  expect(user.is_guest).toBe(true);
  expect(await findById(user.id)).toMatchObject({ id: user.id });
});

test('findByEmail is case-insensitive', async () => {
  const user = await createGuestUser();
  await upgradeToAccount(user.id, 'Foo@Example.com', 'hash');
  expect(await findByEmail('foo@example.com')).toMatchObject({ id: user.id });
});

test('updateProfile applies a partial update without clearing other fields', async () => {
  const user = await createGuestUser();
  await updateProfile(user.id, { interests: ['Runner', 'Puzzle'] });
  const afterSecondPatch = await updateProfile(user.id, { birthYear: 2000 });
  expect(afterSecondPatch.interests).toEqual(['Runner', 'Puzzle']);
  expect(afterSecondPatch.birth_year).toBe(2000);
});
