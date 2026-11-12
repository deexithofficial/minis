import { Pool } from 'pg';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// An idle client can emit an 'error' event (e.g. the connection was dropped
// by the server/network) outside of any query. Without a listener, that
// error is unhandled and crashes the whole process.
pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected Postgres pool error', err);
});
