// src/modules/testimonials/testimonials.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { validateBody, validateQuery } from '../../middleware/validation.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { AppError } from '../../lib/AppError.js';

const router = Router();

const baseSchema = z.object({
  patientName: z.string().trim().min(2).max(100),
  content: z.string().trim().min(10).max(1000),
  rating: z.number().int().min(1).max(5),
  service: z.string().trim().max(100).optional(),
});

const submitSchema = baseSchema.extend({ website: z.string().optional() }); // honeypot
const createSchema = baseSchema.extend({ isPublished: z.boolean().default(false) });


const updateSchema = baseSchema
  .extend({ isPublished: z.boolean() })
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'No fields to update');

const adminListSchema = z.object({ isPublished: z.stringbool().optional() });

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { message: 'Too many submissions, try again later' },
});

/* ---------- Public ---------- */

router.get('/', async (_req, res) => {
  res.json(
    await prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, patientName: true, content: true, rating: true, service: true, createdAt: true },
    }),
  );
});

router.post('/submit', submitLimiter, validateBody(submitSchema), async (_req, res) => {
  const { website, ...data } = res.locals.body as z.infer<typeof submitSchema>;
  if (website) return res.status(201).json({ ok: true });
  await prisma.testimonial.create({ data: {patientName: data.patientName, content: data.content, rating: data.rating, service: data.service ?? null } });

  res.status(201).json({ ok: true });
});

/* ---------- Admin ---------- */

router.get('/all', requireAuth, validateQuery(adminListSchema), async (_req, res) => {
  const { isPublished } = res.locals.query as z.infer<typeof adminListSchema>;
  const where: Prisma.TestimonialWhereInput = isPublished === undefined ? {} : { isPublished };
  res.json(await prisma.testimonial.findMany({ where, orderBy: { createdAt: 'desc' } }));
});

router.post('/', requireAuth, validateBody(createSchema), async (_req, res) => {
  const data = res.locals.body as z.infer<typeof createSchema>;

  const testimonial = await prisma.testimonial.create({
    data: {
      patientName: data.patientName,
      content: data.content,
      rating: data.rating,
      service: data.service ?? null,
      isPublished: data.isPublished ?? false, 
    },
  });

  res.status(201).json(testimonial);
});

router.patch('/:id', requireAuth, validateBody(updateSchema), async (req, res) => {
     const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        
          if (!id) {
            throw new AppError(400, 'Invalid testimonal ID');
          }
  const data = res.locals.body as z.infer<typeof updateSchema>;
  res.json(await prisma.testimonial.update({ where: { id }, data: {data: {patientName: data.patientName, content: data.content, rating: data.rating, service: data.service ?? null }}}));
});

router.delete('/:id', requireAuth, async (req, res) => {
     const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        
          if (!id) {
            throw new AppError(400, 'Invalid testimonal ID');
          }
  await prisma.testimonial.delete({ where: { id } });
  res.status(204).end();
});

export default router;