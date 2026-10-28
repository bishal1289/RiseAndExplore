import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { HttpError } from '../lib/http.js';

/** Validates and replaces req.body with the parsed (defaulted, stripped) value. */
export const validate =
  (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      const field = first?.path.join('.') || 'form';
      return next(
        new HttpError(400, `Please check "${field}": ${first?.message ?? 'invalid'}`, result.error.flatten()),
      );
    }
    req.body = result.data;
    next();
  };
