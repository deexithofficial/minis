import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { authRouter } from './auth/routes';
import { usersRouter } from './users/routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/users', usersRouter);

function clientErrorStatus(err: unknown): number | null {
  if (typeof err !== 'object' || err === null) return null;
  const candidate = (err as { status?: unknown; statusCode?: unknown }).status ??
    (err as { statusCode?: unknown }).statusCode;
  return typeof candidate === 'number' && candidate >= 400 && candidate < 500 ? candidate : null;
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);

  const status = clientErrorStatus(err);
  if (status !== null) {
    const isBodyParseFailure =
      typeof err === 'object' && err !== null && (err as { type?: unknown }).type === 'entity.parse.failed';
    res.status(status).json({ error: isBodyParseFailure ? 'Malformed JSON' : 'Bad request' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

export { app };
