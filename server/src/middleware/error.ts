import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { HttpError } from '../lib/http.js';
import { env } from '../config/env.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ error: Object.values(err.errors)[0]?.message ?? 'Invalid data' });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (typeof err === 'object' && err && 'code' in err && (err as { code: number }).code === 11000) {
    return res.status(409).json({ error: 'That name or link is already used by another item' });
  }
  console.error(err);
  res.status(500).json({ error: env.isProd ? 'Something went wrong' : String(err) });
}
