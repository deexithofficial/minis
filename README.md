# Minis — Onboarding Flow

A React Native (Expo) onboarding flow backed by a Node/Express + Postgres API.
See `docs/superpowers/specs/2026-11-12-onboarding-design.md` for the full design.

## Running locally

```bash
docker compose up -d                      # starts Postgres
cp .env.example .env                      # repo root (Postgres container creds)
cp backend/.env.example backend/.env      # backend (DATABASE_URL, JWT_SECRET, PORT)
cd backend && npm install && npm run dev  # API on http://localhost:4000

cd mobile && npm install
EXPO_PUBLIC_API_URL=http://localhost:4000 npx expo start
```

Testing on a physical device instead of a simulator? Set `EXPO_PUBLIC_API_URL`
to your host machine's LAN IP (e.g. `http://192.168.1.23:4000`) instead of
`localhost` — the device can't resolve `localhost` as your computer.
