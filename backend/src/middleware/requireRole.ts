import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/AppError.js';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = res.locals.userId;

      if (!userId) {
        throw new AppError(401, 'Authentication required');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new AppError(401, 'User account not found');
      }

      if (!allowedRoles.includes(user.role)) {
        throw new AppError(403, 'You do not have permission to perform this action');
      }

      res.locals.userRole = user.role;

      next();
    } catch (error) {
      next(error);
    }
  };
};