import { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/AppError.js';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Already exists' });
    if (err.code === 'P2025') return res.status(404).json({ message: 'Not found' });
    if (err.code === 'P2034') return res.status(409).json({ message: 'Please try again' });
    if (err.code === 'P2003') {
  return res.status(409).json({ message: 'Item is in use and cannot be deleted. Deactivate it instead.' });
}
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
};