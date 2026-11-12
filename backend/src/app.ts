import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { authRouter } from './auth/routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

export { app };
