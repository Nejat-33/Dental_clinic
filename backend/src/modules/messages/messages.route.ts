// src/modules/messages/messages.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { MessageStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { phoneSchema } from '../../lib/phone.js';
import { validateBody, validateQuery } from '../../middleware/validation.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  phone: phoneSchema.optional(),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10).max(2000),
  website: z.string().optional(), // honeypot: hidden field, real users leave it empty
});

const listSchema = z.object({
  status: z.enum(MessageStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const statusSchema = z.object({ status: z.enum(MessageStatus) });

const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many messages, try again later' },
});

/* ---------- Public ---------- */

router.post('/', messageLimiter, validateBody(createSchema), async (_req, res) => {
  const { website, ...data } = res.locals.body as z.infer<typeof createSchema>;
  if (website) return res.status(201).json({ ok: true }); // bot: pretend success, save nothing

 await prisma.message.create({
    data: {
      ...data,
      phone: data.phone ?? null,
      subject: data.subject ?? null,
    },
  });
  res.status(201).json({ ok: true });
});



router.get('/unread-count', requireAuth, async (_req, res) => {
  const count = await prisma.message.count({ where: { status: MessageStatus.UNREAD } });
  res.json({ count });
});

router.get('/', requireAuth, validateQuery(listSchema), async (_req, res) => {
  const { status, page, limit } = res.locals.query as z.infer<typeof listSchema>;
  const where: Prisma.MessageWhereInput = status ? { status } : {};

  const [data, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);

  res.json({ data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get('/:id', requireAuth, async (req, res) => {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
      if (!id) {
        throw new AppError(400, 'Invalid message ID');
      }
  const message = await prisma.message.findUnique({ where: { id} });
  if (!message) throw new AppError(404, 'Message not found');
  res.json(message);
});

router.patch('/:id/status', requireAuth, validateBody(statusSchema), async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!id) {
    throw new AppError(400, 'Invalid message ID');
  }
  const { status } = res.locals.body as z.infer<typeof statusSchema>;
  res.json(await prisma.message.update({ where: { id }, data: { status } }));
});

router.delete('/:id', requireAuth, async (req, res) => {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
      if (!id) {
        throw new AppError(400, 'Invalid message ID');
      }
  await prisma.message.delete({ where: { id } });
  res.status(204).end();
});

export default router;