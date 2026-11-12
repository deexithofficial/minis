import { pool } from '../db';

export interface UserRow {
  id: string;
  email: string | null;
  password_hash: string | null;
  is_guest: boolean;
  birth_year: number | null;
  interests: string[];
  character_look: string | null;
  character_name: string | null;
  notifications_opt_in: boolean | null;
  created_at: Date;
  updated_at: Date;
}

export async function createGuestUser(): Promise<UserRow> {
  const result = await pool.query<UserRow>(
    'INSERT INTO users (is_guest) VALUES (true) RETURNING *'
  );
  return result.rows[0];
}

export async function findById(id: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    'SELECT * FROM users WHERE lower(email) = lower($1)',
    [email]
  );
  return result.rows[0] ?? null;
}

export async function createAccount(
  email: string,
  passwordHash: string
): Promise<UserRow> {
  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, password_hash, is_guest)
     VALUES (lower($1), $2, false)
     RETURNING *`,
    [email, passwordHash]
  );
  return result.rows[0];
}

export async function upgradeToAccount(
  id: string,
  email: string,
  passwordHash: string
): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    `UPDATE users
     SET email = lower($2), password_hash = $3, is_guest = false, updated_at = now()
     WHERE id = $1 AND is_guest = true
     RETURNING *`,
    [id, email, passwordHash]
  );
  return result.rows[0] ?? null;
}

type ProfilePatch = Partial<{
  birthYear: number;
  interests: string[];
  characterLook: string | null;
  characterName: string | null;
  notificationsOptIn: boolean;
}>;

const PATCH_COLUMN_MAP: Record<keyof ProfilePatch, string> = {
  birthYear: 'birth_year',
  interests: 'interests',
  characterLook: 'character_look',
  characterName: 'character_name',
  notificationsOptIn: 'notifications_opt_in',
};

export async function updateProfile(
  id: string,
  patch: ProfilePatch
): Promise<UserRow> {
  const entries = (Object.keys(patch) as (keyof ProfilePatch)[]).filter(
    (key) => patch[key] !== undefined
  );

  const values: unknown[] = [id];
  const setClauses = entries.map((key) => {
    values.push(patch[key]);
    return `${PATCH_COLUMN_MAP[key]} = $${values.length}`;
  });
  setClauses.push('updated_at = now()');

  const result = await pool.query<UserRow>(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0];
}
