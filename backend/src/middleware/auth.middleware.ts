
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new AppError(401, 'Not authenticated');
    }

    let payload: jwt.JwtPayload;

    try {
      payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    } catch {
      throw new AppError(401, 'Invalid or expired session');
    }

    if (typeof payload.sub !== 'string') {
      throw new AppError(401, 'Invalid session');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Your account is inactive or no longer exists');
    }

    res.locals.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
};
