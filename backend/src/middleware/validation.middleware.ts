
import { RequestHandler } from 'express';
import { ZodType } from 'zod';

export const validateBody = (schema: ZodType): RequestHandler => (req, res, next) => {
  res.locals.body = schema.parse(req.body); // throws ZodError, handled centrally (Express 5 catches sync throws)
  next();
};

export const validateQuery = (schema: ZodType): RequestHandler => (req, res, next) => {
  res.locals.query = schema.parse(req.query);
  next();
};