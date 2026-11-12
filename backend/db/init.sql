CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  password_hash TEXT,
  is_guest BOOLEAN NOT NULL DEFAULT TRUE,
  birth_year INTEGER,
  interests TEXT[] NOT NULL DEFAULT '{}',
  character_look TEXT,
  character_name TEXT,
  notifications_opt_in BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));
