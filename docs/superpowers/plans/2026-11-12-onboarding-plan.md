# Minis Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the onboarding flow (Welcome → Age check → Interests → Save progress → Character → Notifications, plus the Age-blocked and Sign-in branches) as a React Native (Expo) app backed by a Node/Express + Postgres JWT API, matching the referenced design.

**Architecture:** Two independent apps in one repo. `backend/` is an Express API over a single Postgres `users` table (Postgres via Docker locally), issuing JWTs for guest and full accounts. `mobile/` is an Expo TypeScript app with a React Navigation native-stack covering the onboarding screens, a small context for session state, and a thin fetch-based API client. Backend ships first since every mobile screen after Welcome calls it.

**Tech Stack:** Node.js + Express + TypeScript + `pg` + `bcrypt` + `jsonwebtoken`, Postgres 16 (Docker), Jest + Supertest. Expo + TypeScript + `@react-navigation/native-stack` + `expo-font` + `expo-secure-store` + `expo-notifications` + `react-native-svg`, Jest (`jest-expo` preset) + `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-11-12-onboarding-design.md`

## Global Constraints

- JWT: `HS256`, 30-day expiry, payload `{ sub: <user id>, isGuest: <bool> }`, signed with required env var `JWT_SECRET` (server refuses to start without it).
- Passwords hashed with `bcrypt`, cost factor `10`; minimum password length `8`.
- Minimum age is `13` (birth-year-only comparison: `currentYear - birthYear < 13` is blocked).
- All error responses: `{ error: string }`. Validation → `400`. Auth failure → `401`. Conflict → `409`. Unhandled → `500` with generic `{ error: "Internal server error" }`, no stack trace to the client.
- Public user shape (camelCase, never includes `password_hash`): `{ id, email, isGuest, birthYear, interests, characterLook, characterName, notificationsOptIn, createdAt }`.
- Colors: background `#0F1014`, screen surface `#212124`, elevated `#2E2F35`, inactive dot `#3F4047`, text `#F4F2EC`, muted text `#A3A6B2`, lime `#C6F24E`, violet `#6A47F5`, pink `#FF9FD0`, sky `#7DB8FF`.
- Font: bundled `CalSans-SemiBold.otf` as `CalSans-SemiBold`, system sans-serif fallback before it loads.
- `EXPO_PUBLIC_API_URL` configures the mobile API base URL, default `http://localhost:4000`.
- Save-progress screen shows no score/coins/stats row (no first-game data exists to show).
- Apple/Google buttons render but are disabled; pressing either shows a "Coming soon" alert and makes no API call.
- No migration framework; `backend/db/init.sql` is the whole schema for this stage.

## Review Focus

- Duplicate email on signup must be rejected case-insensitively (`Foo@x.com` collides with `foo@x.com`) — Task 3 (repo lookup) and Task 4 (signup 409).
- `PATCH /users/me` must apply a partial update without clearing fields the request didn't mention — Task 5.
- `POST /auth/signup` with a present-but-invalid/garbage `Authorization` header must be treated as "no guest token" (fresh account created), not rejected with `401` — Task 4.
- The age boundary must allow exactly 13 (`currentYear - birthYear === 13` is NOT blocked) and block exactly 12 — Task 8 (pure helper) and Task 11 (screen-level navigation).
- Interests "Skip" and "Continue" with zero chips selected must still save successfully (`interests: []` is valid) — Task 12.

---

## Backend

### Task 1: Backend scaffold, Postgres via Docker, health check

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `backend/.gitignore`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Create: `backend/db/init.sql`
- Create: `docker-compose.yml`
- Test: `backend/tests/health.test.ts`

**Interfaces:**
- Produces: `app: express.Application` exported from `backend/src/app.ts` (no `listen()` call there — `server.ts` imports `app` and calls `app.listen(process.env.PORT ?? 4000)`). Used by every later backend test (`supertest(app)`) and by Task 5 to mount routers.

- [ ] **Step 1: Write the failing test**

```ts
// backend/tests/health.test.ts
import request from 'supertest';
import { app } from '../src/app';

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok' });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- health.test.ts`
Expected: FAIL — `src/app.ts` does not exist / `app` not exported.

- [ ] **Step 3: Scaffold the project**

`backend/package.json` with dependencies `express`, `pg`, `bcrypt`, `jsonwebtoken`, `cors`, `dotenv`; devDependencies `typescript`, `ts-node-dev`, `jest`, `ts-jest`, `supertest`, `@types/express`, `@types/supertest`, `@types/jsonwebtoken`, `@types/bcrypt`, `@types/node`. Scripts: `dev` (`ts-node-dev src/server.ts`), `build` (`tsc`), `test` (`jest`). `tsconfig.json` targeting `es2020`/`commonjs`, `strict: true`. `.env.example` listing `DATABASE_URL`, `JWT_SECRET`, `PORT`. `src/app.ts` creates an `express()` app, applies `express.json()` and `cors()`, and defines `GET /health` returning `{ status: 'ok' }`. `src/server.ts` imports `app` and calls `app.listen`.

- [ ] **Step 4: Write `docker-compose.yml` and `backend/db/init.sql`**

`docker-compose.yml` at the repo root defines one service, `postgres` (image `postgres:16`), with `POSTGRES_DB=minis`, `POSTGRES_USER`/`POSTGRES_PASSWORD` from a `.env` (document default `minis`/`minis` in a root `.env.example`), a named volume for data, port `5432:5432`, and mounts `./backend/db/init.sql` read-only into `/docker-entrypoint-initdb.d/init.sql`. `backend/db/init.sql` contains exactly the `users` table DDL from the spec (`CREATE TABLE users (...)` with `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `email TEXT UNIQUE`, `password_hash TEXT`, `is_guest BOOLEAN NOT NULL DEFAULT TRUE`, `birth_year INTEGER`, `interests TEXT[] NOT NULL DEFAULT '{}'`, `character_look TEXT`, `character_name TEXT`, `notifications_opt_in BOOLEAN`, `created_at`/`updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`), preceded by `CREATE EXTENSION IF NOT EXISTS pgcrypto;` (needed for `gen_random_uuid()`).

- [ ] **Step 5: Run test to verify it passes**

Run: `docker compose up -d && cd backend && npm test -- health.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend docker-compose.yml .env.example
git commit -m "feat(backend): scaffold Express app, Postgres via Docker, health check"
```

---

### Task 2: DB pool, JWT, and password helpers

**Files:**
- Create: `backend/src/db.ts`
- Create: `backend/src/auth/jwt.ts`
- Create: `backend/src/auth/password.ts`
- Test: `backend/tests/jwt.test.ts`
- Test: `backend/tests/password.test.ts`

**Interfaces:**
- Consumes: none beyond `pg`, `jsonwebtoken`, `bcrypt`.
- Produces: `pool: pg.Pool` from `backend/src/db.ts` (reads `DATABASE_URL`), used by Task 3's repo. `signToken(payload: { sub: string; isGuest: boolean }): string` and `verifyToken(token: string): { sub: string; isGuest: boolean } | null` from `backend/src/auth/jwt.ts` (returns `null` instead of throwing on any invalid/malformed/expired token), used by Task 4's routes and middleware. `hashPassword(plain: string): Promise<string>` and `verifyPassword(plain: string, hash: string): Promise<boolean>` from `backend/src/auth/password.ts`, used by Task 4.

- [ ] **Step 1: Write the failing tests**

```ts
// backend/tests/jwt.test.ts
import { signToken, verifyToken } from '../src/auth/jwt';

test('round-trips a valid token', () => {
  const token = signToken({ sub: 'abc-123', isGuest: true });
  expect(verifyToken(token)).toEqual({ sub: 'abc-123', isGuest: true });
});

test('returns null for a malformed token', () => {
  expect(verifyToken('not-a-token')).toBeNull();
});
```

```ts
// backend/tests/password.test.ts
import { hashPassword, verifyPassword } from '../src/auth/password';

test('verifies a correct password and rejects a wrong one', async () => {
  const hash = await hashPassword('correct-horse-battery');
  expect(await verifyPassword('correct-horse-battery', hash)).toBe(true);
  expect(await verifyPassword('wrong-password', hash)).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npm test -- jwt.test.ts password.test.ts`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement `backend/src/db.ts`**

Export `pool = new Pool({ connectionString: process.env.DATABASE_URL })`.

- [ ] **Step 4: Implement `backend/src/auth/jwt.ts`**

`signToken` uses `jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '30d' })` (throw at module load if `JWT_SECRET` is unset). `verifyToken` wraps `jwt.verify` in try/catch, returning the decoded `{ sub, isGuest }` on success and `null` on any thrown error.

- [ ] **Step 5: Implement `backend/src/auth/password.ts`**

`hashPassword` → `bcrypt.hash(plain, 10)`. `verifyPassword` → `bcrypt.compare(plain, hash)`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && JWT_SECRET=test-secret npm test -- jwt.test.ts password.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/db.ts backend/src/auth backend/tests/jwt.test.ts backend/tests/password.test.ts
git commit -m "feat(backend): db pool, JWT, and password hashing helpers"
```

---

### Task 3: Users repository and public-shape mapping

**Files:**
- Create: `backend/src/users/repo.ts`
- Create: `backend/src/users/publicUser.ts`
- Test: `backend/tests/repo.test.ts`

**Interfaces:**
- Consumes: `pool` (Task 2).
- Produces: from `backend/src/users/repo.ts`: `createGuestUser(): Promise<UserRow>`, `findById(id: string): Promise<UserRow | null>`, `findByEmail(email: string): Promise<UserRow | null>` (case-insensitive — compares against a lower-cased stored email), `upgradeToAccount(id: string, email: string, passwordHash: string): Promise<UserRow>` (sets `email = lower(email)`, `password_hash`, `is_guest = false`), `updateProfile(id: string, patch: Partial<{ birthYear: number; interests: string[]; characterLook: string; characterName: string; notificationsOptIn: boolean }>): Promise<UserRow>` (only sets columns present in `patch`). `UserRow` is the raw snake_case DB row shape. From `backend/src/users/publicUser.ts`: `toPublicUser(row: UserRow): PublicUser` mapping to the camelCase shape from Global Constraints, omitting `password_hash`. Used by Task 4 and Task 5.

- [ ] **Step 1: Write the failing tests**

```ts
// backend/tests/repo.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker compose up -d && cd backend && DATABASE_URL=postgres://minis:minis@localhost:5432/minis npm test -- repo.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `backend/src/users/repo.ts`**

Each function is a single parameterized SQL query via `pool.query`. `updateProfile` builds its `SET` clause only from keys present in `patch` (e.g. by collecting `[column, value]` pairs for defined keys and joining them), plus `updated_at = now()`, and returns the updated row (`RETURNING *`). `findByEmail` compares with `WHERE lower(email) = lower($1)`. `upgradeToAccount` stores the email lower-cased.

- [ ] **Step 4: Implement `backend/src/users/publicUser.ts`**

`toPublicUser` maps `row.birth_year → birthYear`, `row.is_guest → isGuest`, `row.character_look → characterLook`, `row.character_name → characterName`, `row.notifications_opt_in → notificationsOptIn`, `row.created_at → createdAt`, passing `id`, `email`, `interests` through directly.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && DATABASE_URL=postgres://minis:minis@localhost:5432/minis npm test -- repo.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/users/repo.ts backend/src/users/publicUser.ts backend/tests/repo.test.ts
git commit -m "feat(backend): users repository and public-shape mapping"
```

---

### Task 4: Auth routes (`/auth/guest`, `/auth/signup`, `/auth/login`) and auth middleware

**Files:**
- Create: `backend/src/middleware/requireAuth.ts`
- Create: `backend/src/auth/routes.ts`
- Modify: `backend/src/app.ts` (mount `authRouter` at `/auth`)
- Test: `backend/tests/auth.test.ts`

**Interfaces:**
- Consumes: `signToken`/`verifyToken` (Task 2), `hashPassword`/`verifyPassword` (Task 2), repo functions + `toPublicUser` (Task 3).
- Produces: `requireAuth: RequestHandler` — verifies `Authorization: Bearer <token>`, on success sets `req.auth = { id: payload.sub, isGuest: payload.isGuest }` and calls `next()`, on failure responds `401 { error: 'Unauthorized' }`. `optionalGuestAuth: RequestHandler` — same verification, but on any failure (missing header, invalid token, or `isGuest: false`) it calls `next()` without setting `req.auth` and without erroring; only a valid guest token sets `req.auth`. Both used by Task 5; `optionalGuestAuth` used by `/auth/signup` in this task. `authRouter: Router` exported from `backend/src/auth/routes.ts`, mounted in `app.ts` at `/auth`.

- [ ] **Step 1: Write the failing tests**

```ts
// backend/tests/auth.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && DATABASE_URL=postgres://minis:minis@localhost:5432/minis JWT_SECRET=test-secret npm test -- auth.test.ts`
Expected: FAIL — routes don't exist.

- [ ] **Step 3: Implement `backend/src/middleware/requireAuth.ts`**

Both middlewares read the `Authorization` header, split on `Bearer `, call `verifyToken`. `requireAuth` 401s on any falsy result. `optionalGuestAuth` only attaches `req.auth` when the result is truthy and `isGuest === true`; otherwise it proceeds unauthenticated.

- [ ] **Step 4: Implement `backend/src/auth/routes.ts`**

`POST /guest`: `createGuestUser()`, `signToken({ sub: user.id, isGuest: true })`, respond `201 { token, user: toPublicUser(user) }`.
`POST /signup`: validate `email` present and `password.length >= 8` (else `400`); use `optionalGuestAuth` so `req.auth` may be set; if `req.auth` present, call `upgradeToAccount(req.auth.id, email, await hashPassword(password))`, else check `findByEmail` first (→ `409` if taken) and insert a fresh non-guest row (add an `createAccount(email, passwordHash)` repo function alongside Task 3's others, returning the row); sign a new token with `isGuest: false`; respond `200 { token, user }`. Catch a unique-constraint DB error from the upgrade path too and map it to `409`.
`POST /login`: `findByEmail`, `401` if not found or `verifyPassword` fails; else sign token with the row's `is_guest` and respond `200 { token, user }`.

- [ ] **Step 5: Mount the router**

In `backend/src/app.ts`, `app.use('/auth', authRouter)`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && DATABASE_URL=postgres://minis:minis@localhost:5432/minis JWT_SECRET=test-secret npm test -- auth.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/middleware backend/src/auth/routes.ts backend/src/app.ts backend/tests/auth.test.ts
git commit -m "feat(backend): guest/signup/login auth routes"
```

---

### Task 5: Users routes (`GET /users/me`, `PATCH /users/me`)

**Files:**
- Create: `backend/src/users/routes.ts`
- Modify: `backend/src/app.ts` (mount `usersRouter` at `/users`)
- Test: `backend/tests/users.test.ts`

**Interfaces:**
- Consumes: `requireAuth` (Task 4), `updateProfile`/`findById` (Task 3), `toPublicUser` (Task 3).
- Produces: `usersRouter: Router`, mounted at `/users`.

- [ ] **Step 1: Write the failing tests**

```ts
// backend/tests/users.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && DATABASE_URL=postgres://minis:minis@localhost:5432/minis JWT_SECRET=test-secret npm test -- users.test.ts`
Expected: FAIL — route doesn't exist.

- [ ] **Step 3: Implement `backend/src/users/routes.ts`**

Both routes use `requireAuth`. `GET /me`: `findById(req.auth.id)` → `toPublicUser`. `PATCH /me`: pick only the known keys (`birthYear`, `interests`, `characterLook`, `characterName`, `notificationsOptIn`) off `req.body`, call `updateProfile(req.auth.id, picked)`, respond with `toPublicUser(result)`.

- [ ] **Step 4: Mount the router**

In `backend/src/app.ts`, `app.use('/users', usersRouter)`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && DATABASE_URL=postgres://minis:minis@localhost:5432/minis JWT_SECRET=test-secret npm test -- users.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/users/routes.ts backend/src/app.ts backend/tests/users.test.ts
git commit -m "feat(backend): GET/PATCH /users/me"
```

Backend is now feature-complete for this plan's scope.

---

## Mobile

### Task 6: Expo scaffold, design tokens, bundled font

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/app.json`
- Create: `mobile/tsconfig.json`
- Create: `mobile/babel.config.js`
- Create: `mobile/App.tsx` (minimal placeholder, finalized in Task 15)
- Create: `mobile/src/theme/colors.ts`
- Create: `mobile/src/theme/typography.ts`
- Create: `mobile/src/assets/fonts/CalSans-SemiBold.otf`
- Test: `mobile/src/theme/__tests__/colors.test.ts`

**Interfaces:**
- Produces: `colors` object from `mobile/src/theme/colors.ts` with keys `background, surface, elevated, dotInactive, text, textMuted, lime, violet, pink, sky` set to the exact hex values in Global Constraints. `fonts.display = 'CalSans-SemiBold'` and `fonts.fallback = 'System'` from `mobile/src/theme/typography.ts`. Both imported by every screen/component task from here on.

- [ ] **Step 1: Write the failing test**

```ts
// mobile/src/theme/__tests__/colors.test.ts
import { colors } from '../colors';

test('exposes the exact design token hex values', () => {
  expect(colors).toEqual({
    background: '#0F1014', surface: '#212124', elevated: '#2E2F35', dotInactive: '#3F4047',
    text: '#F4F2EC', textMuted: '#A3A6B2', lime: '#C6F24E', violet: '#6A47F5', pink: '#FF9FD0', sky: '#7DB8FF',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npm test -- colors.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Scaffold the Expo project**

`package.json` with `expo`, `react`, `react-native`, `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`, `expo-font`, `expo-secure-store`, `expo-notifications`, `react-native-svg`; devDependencies `typescript`, `jest-expo`, `@testing-library/react-native`, `@types/react`. `app.json` with `name: "Minis"`, `slug: "minis"`. `tsconfig.json` extending `expo/tsconfig.base`. `babel.config.js` using `babel-preset-expo`. `App.tsx` renders a bare `<View><Text>Loading…</Text></View>` for now (Task 15 replaces this). Download the font: `curl -L -o mobile/src/assets/fonts/CalSans-SemiBold.otf https://github.com/calcom/font/raw/main/CalSans-SemiBold.otf`.

- [ ] **Step 4: Implement the theme files**

`colors.ts` exports the `colors` object with the exact values above. `typography.ts` exports `fonts = { display: 'CalSans-SemiBold', fallback: 'System' }` and a `type` scale object (e.g. `hero: 34`, `headline: 28`, `body: 16`, `button: 20`, `caption: 13`) matching the design's sizes.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd mobile && npm test -- colors.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add mobile/package.json mobile/app.json mobile/tsconfig.json mobile/babel.config.js mobile/App.tsx mobile/src/theme mobile/src/assets
git commit -m "feat(mobile): Expo scaffold, design tokens, bundled Cal Sans font"
```

---

### Task 7: API client and token storage

**Files:**
- Create: `mobile/src/api/client.ts`
- Create: `mobile/src/storage/tokenStorage.ts`
- Test: `mobile/src/api/__tests__/client.test.ts`
- Test: `mobile/src/storage/__tests__/tokenStorage.test.ts`

**Interfaces:**
- Produces: `class ApiError extends Error { status: number }` and `async function apiRequest<T>(path: string, options?: { method?: string; body?: unknown; token?: string }): Promise<T>` from `mobile/src/api/client.ts` — base URL `process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000'`; on non-2xx, attempts to parse the JSON body for `error`, and if that fails (body isn't JSON, or has no `error` field), throws `ApiError` with message `'Request failed'`. `saveToken(token: string): Promise<void>`, `getToken(): Promise<string | null>`, `clearToken(): Promise<void>` from `mobile/src/storage/tokenStorage.ts` (thin wrapper over `expo-secure-store`'s `setItemAsync`/`getItemAsync`/`deleteItemAsync` under key `'minis.token'`). Both used by Task 8.

- [ ] **Step 1: Write the failing tests**

```ts
// mobile/src/api/__tests__/client.test.ts
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
```

```ts
// mobile/src/storage/__tests__/tokenStorage.test.ts
import * as SecureStore from 'expo-secure-store';
import { saveToken, getToken, clearToken } from '../tokenStorage';

jest.mock('expo-secure-store');

test('saves, reads, and clears the token under a fixed key', async () => {
  await saveToken('tok-123');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('minis.token', 'tok-123');
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('tok-123');
  expect(await getToken()).toBe('tok-123');
  await clearToken();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('minis.token');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd mobile && npm test -- client.test.ts tokenStorage.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `mobile/src/api/client.ts`**

`ApiError` constructor takes `(status: number, message: string)`. `apiRequest` builds the URL from the base + `path`, sets `Content-Type: application/json` and `Authorization` (only when `options.token` is given), `JSON.stringify`s `options.body` when present, calls `fetch`; on `res.ok` returns `res.json()`; otherwise wraps the body-parsing attempt in try/catch and throws `new ApiError(res.status, parsedErrorOrFallback)`.

- [ ] **Step 4: Implement `mobile/src/storage/tokenStorage.ts`**

Wraps `SecureStore.setItemAsync('minis.token', token)`, `SecureStore.getItemAsync('minis.token')`, `SecureStore.deleteItemAsync('minis.token')`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd mobile && npm test -- client.test.ts tokenStorage.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add mobile/src/api/client.ts mobile/src/storage/tokenStorage.ts mobile/src/api/__tests__/client.test.ts mobile/src/storage/__tests__/tokenStorage.test.ts
git commit -m "feat(mobile): API client and secure token storage"
```

---

### Task 8: Auth/users API wrappers and onboarding reducer helpers

**Files:**
- Create: `mobile/src/api/auth.ts`
- Create: `mobile/src/api/users.ts`
- Create: `mobile/src/state/onboardingReducer.ts`
- Test: `mobile/src/api/__tests__/auth.test.ts`
- Test: `mobile/src/state/__tests__/onboardingReducer.test.ts`

**Interfaces:**
- Consumes: `apiRequest`, `ApiError` (Task 7).
- Produces: `guestSignIn(): Promise<{ token: string; user: PublicUser }>`, `signup(params: { email: string; password: string; guestToken?: string }): Promise<{ token: string; user: PublicUser }>`, `login(params: { email: string; password: string }): Promise<{ token: string; user: PublicUser }>` from `mobile/src/api/auth.ts`. `getMe(token: string): Promise<PublicUser>`, `updateMe(token: string, patch: Partial<Pick<PublicUser, 'birthYear' | 'interests' | 'characterLook' | 'characterName' | 'notificationsOptIn'>>): Promise<PublicUser>` from `mobile/src/api/users.ts`. `MIN_AGE = 13`, `isUnderMinimumAge(birthYear: number, now?: Date): boolean`, `toggleInterest(current: string[], interest: string): string[]`, `PublicUser` type, from `mobile/src/state/onboardingReducer.ts`. All consumed by the screen tasks (10–15).

- [ ] **Step 1: Write the failing tests**

```ts
// mobile/src/state/__tests__/onboardingReducer.test.ts
import { isUnderMinimumAge, toggleInterest, MIN_AGE } from '../onboardingReducer';

test('allows exactly the minimum age and blocks one year younger', () => {
  const now = new Date('2026-06-01');
  expect(MIN_AGE).toBe(13);
  expect(isUnderMinimumAge(2026 - 13, now)).toBe(false);
  expect(isUnderMinimumAge(2026 - 12, now)).toBe(true);
});

test('toggleInterest adds an absent interest and removes a present one', () => {
  expect(toggleInterest([], 'Runner')).toEqual(['Runner']);
  expect(toggleInterest(['Runner'], 'Runner')).toEqual([]);
});
```

```ts
// mobile/src/api/__tests__/auth.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd mobile && npm test -- onboardingReducer.test.ts auth.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `mobile/src/state/onboardingReducer.ts`**

`isUnderMinimumAge(birthYear, now = new Date())` returns `(now.getFullYear() - birthYear) < MIN_AGE`. `toggleInterest` returns a new array with `interest` removed if `current.includes(interest)`, else appended. Define and export the `PublicUser` interface matching the backend's public user shape.

- [ ] **Step 4: Implement `mobile/src/api/auth.ts` and `mobile/src/api/users.ts`**

Each function is a one-line call into `apiRequest` with the matching path/method/body/token, per the call shapes asserted in the tests above. `login` has no `token` option. `getMe`/`updateMe` pass `token` and, for `updateMe`, `method: 'PATCH'` with `body: patch`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd mobile && npm test -- onboardingReducer.test.ts auth.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add mobile/src/api/auth.ts mobile/src/api/users.ts mobile/src/state/onboardingReducer.ts mobile/src/api/__tests__/auth.test.ts mobile/src/state/__tests__/onboardingReducer.test.ts
git commit -m "feat(mobile): auth/users API wrappers and onboarding reducer helpers"
```

---

### Task 9: Session context and shared UI components

**Files:**
- Create: `mobile/src/state/OnboardingContext.tsx`
- Create: `mobile/src/components/PillButton.tsx`
- Create: `mobile/src/components/ProgressDots.tsx`
- Create: `mobile/src/components/Chip.tsx`
- Create: `mobile/src/components/BlobMascot.tsx`
- Test: `mobile/src/state/__tests__/OnboardingContext.test.tsx`
- Test: `mobile/src/components/__tests__/PillButton.test.tsx`
- Test: `mobile/src/components/__tests__/ProgressDots.test.tsx`
- Test: `mobile/src/components/__tests__/Chip.test.tsx`

**Interfaces:**
- Consumes: `tokenStorage` (Task 7), `PublicUser` (Task 8).
- Produces: `OnboardingProvider` and `useOnboarding(): { token: string | null; user: PublicUser | null; setSession(token: string, user: PublicUser): void; clearSession(): void }` from `OnboardingContext.tsx`. `PillButton` props `{ label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'disabled'; testID?: string }`. `ProgressDots` props `{ stepCount: number; activeIndex: number }`. `Chip` props `{ label: string; selected: boolean; onPress: () => void }`. `BlobMascot` props `{ color: string; size?: number }`. All consumed by every screen task (10–15).

- [ ] **Step 1: Write the failing tests**

```tsx
// mobile/src/state/__tests__/OnboardingContext.test.tsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as tokenStorage from '../../storage/tokenStorage';
import { OnboardingProvider, useOnboarding } from '../OnboardingContext';

jest.mock('../../storage/tokenStorage');

function Probe() {
  const { token, setSession } = useOnboarding();
  return <Text onPress={() => setSession('tok', { id: '1' } as any)}>{token ?? 'none'}</Text>;
}

test('setSession stores the token and persists it', async () => {
  const { getByText } = render(<OnboardingProvider><Probe /></OnboardingProvider>);
  await act(async () => { getByText('none').props.onPress(); });
  expect(tokenStorage.saveToken).toHaveBeenCalledWith('tok');
});
```

```tsx
// mobile/src/components/__tests__/PillButton.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PillButton } from '../PillButton';

test('fires onPress when enabled, not when disabled', () => {
  const onPress = jest.fn();
  const { getByText, rerender } = render(<PillButton label="Go" onPress={onPress} />);
  fireEvent.press(getByText('Go'));
  expect(onPress).toHaveBeenCalledTimes(1);
  rerender(<PillButton label="Go" onPress={onPress} variant="disabled" />);
  fireEvent.press(getByText('Go'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

```tsx
// mobile/src/components/__tests__/ProgressDots.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressDots } from '../ProgressDots';

test('renders one dot per step', () => {
  const { getAllByTestId } = render(<ProgressDots stepCount={3} activeIndex={1} />);
  expect(getAllByTestId('progress-dot')).toHaveLength(3);
});
```

```tsx
// mobile/src/components/__tests__/Chip.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Chip } from '../Chip';

test('calls onPress when tapped and reflects selected state', () => {
  const onPress = jest.fn();
  const { getByText } = render(<Chip label="Runner" selected onPress={onPress} />);
  fireEvent.press(getByText('Runner'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd mobile && npm test -- OnboardingContext.test.tsx PillButton.test.tsx ProgressDots.test.tsx Chip.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `OnboardingContext.tsx`**

`useState` for `token`/`user`; `setSession(token, user)` updates both and calls `tokenStorage.saveToken(token)`; `clearSession()` nulls both and calls `tokenStorage.clearToken()`. `useOnboarding` throws if called outside the provider.

- [ ] **Step 4: Implement the four components**

`PillButton`: a `Pressable` + `Text`; `variant === 'disabled'` sets `disabled` on the `Pressable` (so `onPress` never fires) and dims the style; `'primary'` uses `colors.lime` background with dark text, `'secondary'` uses a bordered/transparent style with light text. `ProgressDots`: renders `stepCount` views each with `testID="progress-dot"`, the one at `activeIndex` wider and `colors.lime`, others small and `colors.dotInactive`. `Chip`: a `Pressable` + `Text`, background `colors.lime`/`colors.elevated` depending on `selected`. `BlobMascot`: an `react-native-svg` `<Svg>` with a rounded blob `<Path>` (or stacked `<Circle>`/`<Ellipse>`) filled with `color` plus two small dark-dot `<Circle>` eyes, sized by `size` (default `160`).

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd mobile && npm test -- OnboardingContext.test.tsx PillButton.test.tsx ProgressDots.test.tsx Chip.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add mobile/src/state/OnboardingContext.tsx mobile/src/components mobile/src/state/__tests__/OnboardingContext.test.tsx
git commit -m "feat(mobile): session context and shared onboarding UI components"
```

---

### Task 10: Navigation skeleton, Welcome and Sign-in screens

**Files:**
- Create: `mobile/src/navigation/OnboardingStack.tsx`
- Create: `mobile/src/screens/WelcomeScreen.tsx`
- Create: `mobile/src/screens/SignInScreen.tsx`
- Test: `mobile/src/screens/__tests__/WelcomeScreen.test.tsx`
- Test: `mobile/src/screens/__tests__/SignInScreen.test.tsx`

**Interfaces:**
- Consumes: `useOnboarding` (Task 9), `guestSignIn`/`login` (Task 8), `PillButton`/`BlobMascot` (Task 9).
- Produces: `OnboardingStackParamList` type (route names `Welcome | AgeCheck | Interests | SaveProgress | Character | Notifications | AgeBlocked | SignIn | Home`, all with `undefined` params) and `OnboardingStack` component (a `createNativeStackNavigator<OnboardingStackParamList>()` with `initialRouteName="Welcome"`) from `mobile/src/navigation/OnboardingStack.tsx`, registering `Welcome` and `SignIn` now — later tasks modify this file to register their screens.

- [ ] **Step 1: Write the failing tests**

```tsx
// mobile/src/screens/__tests__/WelcomeScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as auth from '../../api/auth';
import { WelcomeScreen } from '../WelcomeScreen';

jest.mock('../../api/auth');
jest.mock('../../storage/tokenStorage');

test('Start playing creates a guest session and navigates to AgeCheck', async () => {
  (auth.guestSignIn as jest.Mock).mockResolvedValue({ token: 'g', user: { id: '1', isGuest: true } });
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><WelcomeScreen navigation={{ navigate } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Start playing'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('AgeCheck'));
});

test('I have an account navigates to SignIn without calling the API', () => {
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><WelcomeScreen navigation={{ navigate } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('I have an account'));
  expect(navigate).toHaveBeenCalledWith('SignIn');
  expect(auth.guestSignIn).not.toHaveBeenCalled();
});
```

```tsx
// mobile/src/screens/__tests__/SignInScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as auth from '../../api/auth';
import { ApiError } from '../../api/client';
import { SignInScreen } from '../SignInScreen';

jest.mock('../../api/auth');
jest.mock('../../storage/tokenStorage');

test('shows an inline error and does not navigate on a failed login', async () => {
  (auth.login as jest.Mock).mockRejectedValue(new ApiError(401, 'Invalid email or password'));
  const navigate = jest.fn();
  const { getByText, getByPlaceholderText } = render(
    <OnboardingProvider><SignInScreen navigation={{ navigate } as any} /></OnboardingProvider>
  );
  fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'wrong');
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(getByText('Incorrect email or password.')).toBeTruthy());
  expect(navigate).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd mobile && npm test -- WelcomeScreen.test.tsx SignInScreen.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `mobile/src/navigation/OnboardingStack.tsx`**

Define `OnboardingStackParamList` and `const Stack = createNativeStackNavigator<OnboardingStackParamList>()`. Export `OnboardingStack` rendering `<Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}><Stack.Screen name="Welcome" component={WelcomeScreen} /><Stack.Screen name="SignIn" component={SignInScreen} /></Stack.Navigator>`.

- [ ] **Step 4: Implement `mobile/src/screens/WelcomeScreen.tsx`**

Violet background, `BlobMascot`s, "Minis" wordmark, headline, subtext, `PillButton` "Start playing" (`variant="primary"`) calling `guestSignIn()` then `setSession(token, user)` then `navigation.navigate('AgeCheck')`; text link "I have an account" calling `navigation.navigate('SignIn')` directly.

- [ ] **Step 5: Implement `mobile/src/screens/SignInScreen.tsx`**

Two `TextInput`s with `placeholder="Email"`/`"Password"` (password `secureTextEntry`), local `error` state, `PillButton` "Continue" calling `login({ email, password })`; on success `setSession` + `navigation.navigate('Home')`; on `ApiError` with status `401`, set `error` to `'Incorrect email or password.'` and render it as `<Text>`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd mobile && npm test -- WelcomeScreen.test.tsx SignInScreen.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add mobile/src/navigation mobile/src/screens/WelcomeScreen.tsx mobile/src/screens/SignInScreen.tsx mobile/src/screens/__tests__
git commit -m "feat(mobile): navigation skeleton, Welcome and Sign-in screens"
```

---

### Task 11: Age-check and Age-blocked screens

**Files:**
- Create: `mobile/src/screens/AgeCheckScreen.tsx`
- Create: `mobile/src/screens/AgeBlockedScreen.tsx`
- Modify: `mobile/src/navigation/OnboardingStack.tsx` (register `AgeCheck`, `AgeBlocked`)
- Test: `mobile/src/screens/__tests__/AgeCheckScreen.test.tsx`

**Interfaces:**
- Consumes: `isUnderMinimumAge` (Task 8), `updateMe` (Task 8), `useOnboarding` (Task 9), `ProgressDots`/`PillButton` (Task 9).

- [ ] **Step 1: Write the failing tests**

```tsx
// mobile/src/screens/__tests__/AgeCheckScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as users from '../../api/users';
import { AgeCheckScreen } from '../AgeCheckScreen';

jest.mock('../../api/users');
jest.mock('../../storage/tokenStorage');

test('a birth year exactly at the minimum age continues to Interests and saves it', async () => {
  const navigate = jest.fn();
  const thisYear = new Date().getFullYear();
  const { getByText, getByTestId } = render(
    <OnboardingProvider><AgeCheckScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent(getByTestId('year-picker'), 'onSelect', thisYear - 13);
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Interests'));
  expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { birthYear: thisYear - 13 });
});

test('a birth year one year under the minimum age blocks without saving', async () => {
  const navigate = jest.fn();
  const thisYear = new Date().getFullYear();
  const { getByText, getByTestId } = render(
    <OnboardingProvider><AgeCheckScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent(getByTestId('year-picker'), 'onSelect', thisYear - 12);
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('AgeBlocked'));
  expect(users.updateMe).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npm test -- AgeCheckScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `mobile/src/screens/AgeCheckScreen.tsx`**

Back button (`navigation.goBack`), `ProgressDots stepCount={3} activeIndex={0}`, headline "When were you born?", subtext, a scrollable year list (`testID="year-picker"`, years e.g. `1950..currentYear`, selecting one sets local `birthYear` state — implemented as a simple `FlatList`/`ScrollView` of pressable year rows is sufficient; it does not need to be the exact perspective-wheel visual). `PillButton` "Continue": if `isUnderMinimumAge(birthYear)` navigate `'AgeBlocked'` (no API call); else `await updateMe(token, { birthYear })` then navigate `'Interests'`.

- [ ] **Step 4: Implement `mobile/src/screens/AgeBlockedScreen.tsx`**

Headline "Not quite yet", subtext from the spec. "Check my birth year" → `navigation.navigate('AgeCheck')`. "Close" → `navigation.navigate('Welcome')`.

- [ ] **Step 5: Register both screens**

In `OnboardingStack.tsx`, add `<Stack.Screen name="AgeCheck" component={AgeCheckScreen} />` and `<Stack.Screen name="AgeBlocked" component={AgeBlockedScreen} />`.

- [ ] **Step 6: Run test to verify it passes**

Run: `cd mobile && npm test -- AgeCheckScreen.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add mobile/src/screens/AgeCheckScreen.tsx mobile/src/screens/AgeBlockedScreen.tsx mobile/src/navigation/OnboardingStack.tsx mobile/src/screens/__tests__/AgeCheckScreen.test.tsx
git commit -m "feat(mobile): age-check and age-blocked screens"
```

---

### Task 12: Interests screen

**Files:**
- Create: `mobile/src/screens/InterestsScreen.tsx`
- Modify: `mobile/src/navigation/OnboardingStack.tsx` (register `Interests`)
- Test: `mobile/src/screens/__tests__/InterestsScreen.test.tsx`

**Interfaces:**
- Consumes: `toggleInterest` (Task 8), `updateMe` (Task 8), `Chip`/`ProgressDots`/`PillButton` (Task 9).
- Produces: exported `INTEREST_OPTIONS = ['Runner', 'Puzzle', 'Casual', 'Arcade', 'Racing', 'Cozy', 'Word', 'Strategy', 'Sports', 'Rhythm']` from `InterestsScreen.tsx`.

- [ ] **Step 1: Write the failing tests**

```tsx
// mobile/src/screens/__tests__/InterestsScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as users from '../../api/users';
import { InterestsScreen } from '../InterestsScreen';

jest.mock('../../api/users');
jest.mock('../../storage/tokenStorage');

test('Skip with nothing selected saves an empty list and navigates', async () => {
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><InterestsScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Skip'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('SaveProgress'));
  expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { interests: [] });
});

test('selecting chips and pressing Continue saves the selection', async () => {
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><InterestsScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Runner'));
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { interests: ['Runner'] }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npm test -- InterestsScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `mobile/src/screens/InterestsScreen.tsx`**

Local `selected: string[]` state; renders a wrapping `View` of `Chip`s for `INTEREST_OPTIONS`, each `onPress` calling `setSelected(toggleInterest(selected, label))`. `ProgressDots stepCount={3} activeIndex={1}`. Both "Continue" and "Skip" call `await updateMe(token, { interests: selected })` (Skip always passes the current `selected`, which starts `[]`) then `navigation.navigate('SaveProgress')`.

- [ ] **Step 4: Register the screen**

Add `<Stack.Screen name="Interests" component={InterestsScreen} />` to `OnboardingStack.tsx`.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd mobile && npm test -- InterestsScreen.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add mobile/src/screens/InterestsScreen.tsx mobile/src/navigation/OnboardingStack.tsx mobile/src/screens/__tests__/InterestsScreen.test.tsx
git commit -m "feat(mobile): interests screen"
```

---

### Task 13: Save-progress screen (sign-up)

**Files:**
- Create: `mobile/src/screens/SaveProgressScreen.tsx`
- Modify: `mobile/src/navigation/OnboardingStack.tsx` (register `SaveProgress`)
- Test: `mobile/src/screens/__tests__/SaveProgressScreen.test.tsx`

**Interfaces:**
- Consumes: `signup` (Task 8), `useOnboarding` (Task 9), `PillButton` (Task 9).

- [ ] **Step 1: Write the failing tests**

```tsx
// mobile/src/screens/__tests__/SaveProgressScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as auth from '../../api/auth';
import { ApiError } from '../../api/client';
import { SaveProgressScreen } from '../SaveProgressScreen';

jest.mock('../../api/auth');
jest.mock('../../storage/tokenStorage');

test('Apple/Google show a coming-soon alert and never call signup', () => {
  jest.spyOn(Alert, 'alert');
  const { getByText } = render(
    <OnboardingProvider><SaveProgressScreen navigation={{ navigate: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Continue with Apple'));
  fireEvent.press(getByText('Continue with Google'));
  expect(Alert.alert).toHaveBeenCalledTimes(2);
  expect(auth.signup).not.toHaveBeenCalled();
});

test('mismatched passwords show an inline error and do not call signup', () => {
  const { getByText, getByPlaceholderText } = render(
    <OnboardingProvider><SaveProgressScreen navigation={{ navigate: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Continue with email'));
  fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'longenough');
  fireEvent.changeText(getByPlaceholderText('Confirm password'), 'different');
  fireEvent.press(getByText('Create account'));
  expect(getByText('Passwords do not match.')).toBeTruthy();
  expect(auth.signup).not.toHaveBeenCalled();
});

test('a duplicate-email signup shows the server message', async () => {
  (auth.signup as jest.Mock).mockRejectedValue(new ApiError(409, 'Email already in use'));
  const { getByText, getByPlaceholderText } = render(
    <OnboardingProvider><SaveProgressScreen navigation={{ navigate: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Continue with email'));
  fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'longenough');
  fireEvent.changeText(getByPlaceholderText('Confirm password'), 'longenough');
  fireEvent.press(getByText('Create account'));
  await waitFor(() => expect(getByText('Email already in use')).toBeTruthy());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npm test -- SaveProgressScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `mobile/src/screens/SaveProgressScreen.tsx`**

Headline "Save your progress", subtext. `PillButton`s "Continue with Apple" / "Continue with Google" (`variant="secondary"`) call `Alert.alert('Coming soon')`. "Continue with email" toggles a local `showForm` flag revealing three `TextInput`s (`placeholder="Email"`, `"Password"` secure, `"Confirm password"` secure) and a "Create account" `PillButton`; its handler checks `password === confirmPassword` (else inline error `'Passwords do not match.'`) and `password.length >= 8` (else `'Password must be at least 8 characters.'`), then calls `signup({ email, password, guestToken: token })`, catching `ApiError` to show `err.message` inline; on success `setSession(newToken, user)` then `navigation.navigate('Character')`. "Not now" calls `navigation.navigate('Character')` directly, no API call.

- [ ] **Step 4: Register the screen**

Add `<Stack.Screen name="SaveProgress" component={SaveProgressScreen} />` to `OnboardingStack.tsx`.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd mobile && npm test -- SaveProgressScreen.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add mobile/src/screens/SaveProgressScreen.tsx mobile/src/navigation/OnboardingStack.tsx mobile/src/screens/__tests__/SaveProgressScreen.test.tsx
git commit -m "feat(mobile): save-progress sign-up screen"
```

---

### Task 14: Character screen

**Files:**
- Create: `mobile/src/screens/CharacterScreen.tsx`
- Modify: `mobile/src/navigation/OnboardingStack.tsx` (register `Character`)
- Test: `mobile/src/screens/__tests__/CharacterScreen.test.tsx`

**Interfaces:**
- Consumes: `updateMe` (Task 8), `useOnboarding` (Task 9), `BlobMascot`/`ProgressDots`/`PillButton` (Task 9). Character look values are the strings `'lime' | 'pink' | 'sky'`.

- [ ] **Step 1: Write the failing tests**

```tsx
// mobile/src/screens/__tests__/CharacterScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as users from '../../api/users';
import { CharacterScreen } from '../CharacterScreen';

jest.mock('../../api/users');
jest.mock('../../storage/tokenStorage');

test('selecting a look and a name, then Continue, saves both', async () => {
  const navigate = jest.fn();
  const { getByText, getByTestId, getByPlaceholderText } = render(
    <OnboardingProvider><CharacterScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByTestId('look-pink'));
  fireEvent.changeText(getByPlaceholderText('Pick a name'), 'Pip');
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Notifications'));
  expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { characterLook: 'pink', characterName: 'Pip' });
});

test('Skip for now navigates without saving', () => {
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><CharacterScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Skip for now'));
  expect(navigate).toHaveBeenCalledWith('Notifications');
  expect(users.updateMe).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile && npm test -- CharacterScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `mobile/src/screens/CharacterScreen.tsx`**

Back button, `ProgressDots stepCount={3} activeIndex={2}`, headline "Make your character", three `BlobMascot`-swatch `Pressable`s with `testID="look-lime" | "look-pink" | "look-sky"` and local `look: 'lime' | 'pink' | 'sky' | null` state, name `TextInput` (`placeholder="Pick a name"`). "Continue" calls `await updateMe(token, { characterLook: look, characterName: name })` then `navigation.navigate('Notifications')`. "Skip for now" navigates directly with no API call.

- [ ] **Step 4: Register the screen**

Add `<Stack.Screen name="Character" component={CharacterScreen} />` to `OnboardingStack.tsx`.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd mobile && npm test -- CharacterScreen.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add mobile/src/screens/CharacterScreen.tsx mobile/src/navigation/OnboardingStack.tsx mobile/src/screens/__tests__/CharacterScreen.test.tsx
git commit -m "feat(mobile): character creation screen"
```

---

### Task 15: Notifications and Home screens, final navigator wiring, font loading

**Files:**
- Create: `mobile/src/screens/NotificationsScreen.tsx`
- Create: `mobile/src/screens/HomeScreen.tsx`
- Modify: `mobile/src/navigation/OnboardingStack.tsx` (register `Notifications`, `Home`)
- Modify: `mobile/App.tsx` (load font, render the full provider + navigator tree)
- Test: `mobile/src/screens/__tests__/NotificationsScreen.test.tsx`
- Test: `mobile/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: `updateMe` (Task 8), `useOnboarding` (Task 9), everything from `OnboardingStack` (Task 10, as modified by Tasks 11–14).

- [ ] **Step 1: Write the failing tests**

```tsx
// mobile/src/screens/__tests__/NotificationsScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as users from '../../api/users';
import { NotificationsScreen } from '../NotificationsScreen';

jest.mock('expo-notifications');
jest.mock('../../api/users');
jest.mock('../../storage/tokenStorage');

test('Turn on reminders requests permission and saves opt-in true even if denied', async () => {
  (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><NotificationsScreen navigation={{ navigate } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Turn on reminders'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Home'));
  expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { notificationsOptIn: true });
});

test('Not now saves opt-in false without requesting OS permission', async () => {
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><NotificationsScreen navigation={{ navigate } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Not now'));
  await waitFor(() => expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { notificationsOptIn: false }));
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
});
```

```tsx
// mobile/__tests__/App.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import * as Font from 'expo-font';
import App from '../App';

jest.mock('expo-font');

test('shows a loading state until fonts finish loading, then the Welcome screen', async () => {
  (Font.useFonts as jest.Mock).mockReturnValue([false]);
  const { getByText, rerender } = render(<App />);
  expect(getByText('Loading…')).toBeTruthy();
  (Font.useFonts as jest.Mock).mockReturnValue([true]);
  rerender(<App />);
  expect(getByText('Start playing')).toBeTruthy();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd mobile && npm test -- NotificationsScreen.test.tsx App.test.tsx`
Expected: FAIL — module not found / `App` still renders only the Task 6 placeholder.

- [ ] **Step 3: Implement `mobile/src/screens/NotificationsScreen.tsx`**

Headline "Keep your streak alive", subtext, a static mock notification preview `View`. "Turn on reminders": `await Notifications.requestPermissionsAsync()` (result ignored for the opt-in value), then `await updateMe(token, { notificationsOptIn: true })`, then `navigation.navigate('Home')`. "Not now": `await updateMe(token, { notificationsOptIn: false })` then navigate, no permission request.

- [ ] **Step 4: Implement `mobile/src/screens/HomeScreen.tsx`**

Plain `View`/`Text` stub: `"Onboarding complete"` plus `user?.email ?? 'Guest'` from `useOnboarding()`.

- [ ] **Step 5: Register both screens and finalize `App.tsx`**

Add `<Stack.Screen name="Notifications" component={NotificationsScreen} />` and `<Stack.Screen name="Home" component={HomeScreen} />` to `OnboardingStack.tsx`. Rewrite `App.tsx`: `const [fontsLoaded] = useFonts({ 'CalSans-SemiBold': require('./src/assets/fonts/CalSans-SemiBold.otf') })`; while `!fontsLoaded`, render `<Text>Loading…</Text>`; once loaded, render `<OnboardingProvider><NavigationContainer><OnboardingStack /></NavigationContainer></OnboardingProvider>`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd mobile && npm test -- NotificationsScreen.test.tsx App.test.tsx`
Expected: PASS

- [ ] **Step 7: Run the full mobile and backend test suites**

Run: `cd backend && npm test && cd ../mobile && npm test`
Expected: PASS (all prior tasks' tests still green)

- [ ] **Step 8: Commit**

```bash
git add mobile/src/screens/NotificationsScreen.tsx mobile/src/screens/HomeScreen.tsx mobile/src/navigation/OnboardingStack.tsx mobile/App.tsx mobile/src/screens/__tests__/NotificationsScreen.test.tsx mobile/__tests__/App.test.tsx
git commit -m "feat(mobile): notifications screen, Home stub, final navigator and font wiring"
```

---

## Manual verification (after all tasks)

Not covered by automated tests — run once the plan is fully implemented:

1. `docker compose up -d` then `cd backend && npm run dev`.
2. `cd mobile && EXPO_PUBLIC_API_URL=http://localhost:4000 npx expo start`, open in Expo Go or a simulator.
3. Walk the full flow once as a guest ending at Home, and once by signing up with email partway through, confirming the account created via `/auth/signup` is the same row as the guest (e.g. by checking `SELECT * FROM users` in the Postgres container).
