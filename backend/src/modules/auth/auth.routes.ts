// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../lib/AppError.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many login attempts, try again later' },
});

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);

router.post('/login', loginLimiter, validateBody(loginSchema), async (_req, res) => {
  const { email, password } = res.locals.body as z.infer<typeof loginSchema>;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw new AppError(401, 'Invalid email or password');

  const token = jwt.sign({}, env.JWT_SECRET, { subject: user.id, expiresIn: '7d' });
  res.cookie('token', token, cookieOptions);
  res.json({ id: user.id, name: user.name, email: user.email });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
});

router.get('/me', requireAuth, async (_req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: res.locals.userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) throw new AppError(401, 'User no longer exists');
  res.json(user);
});
const AuthRouter = router;
export default AuthRouter;