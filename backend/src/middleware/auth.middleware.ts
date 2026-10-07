// src/middleware/auth.ts
import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../lib/AppError.js';

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) throw new AppError(401, 'Not authenticated');

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired session');
  }
  res.locals.userId = payload.sub;
  next();
};