import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation error', errors: err.flatten().fieldErrors });
  }
  if (err instanceof Error) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
  res.status(500).json({ message: 'Internal server error' });
}
