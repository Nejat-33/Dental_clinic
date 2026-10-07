// src/modules/gallery/gallery.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { validateBody, validateQuery } from '../../middleware/validation.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { AppError} from '../../lib/AppError.js';

const router = Router();

const baseSchema = z.object({
  title: z.string().trim().max(150).nullish(),
  imageUrl: z.url(),
  category: z.string().trim().max(50).nullish(),
});

const createSchema = baseSchema.extend({ isPublished: z.boolean().default(true) });

const updateSchema = baseSchema
  .extend({ isPublished: z.boolean() })
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'No fields to update');

const publicQuerySchema = z.object({ category: z.string().trim().max(50).optional() });

/* ---------- Public ---------- */

router.get('/', validateQuery(publicQuerySchema), async (_req, res) => {
  const { category } = res.locals.query as z.infer<typeof publicQuerySchema>;
  const where: Prisma.GalleryImageWhereInput = { isPublished: true, ...(category && { category }) };
  res.json(await prisma.galleryImage.findMany({ where, orderBy: { createdAt: 'desc' } }));
});

/* ---------- Admin ---------- */

router.get('/all', requireAuth, async (_req, res) => {
  res.json(await prisma.galleryImage.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.post('/', requireAuth, validateBody(createSchema), async (_req, res) => {
  const data = res.locals.body as z.infer<typeof createSchema>;
  res.status(201).json(await prisma.galleryImage.create({ data }));
});

router.patch('/:id', requireAuth, validateBody(updateSchema), async (req, res) => {
  const data = res.locals.body as z.infer<typeof updateSchema>;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      
        if (!id) {
          throw new AppError(400, 'Invalid Gallery ID');
        }
  res.json(await prisma.galleryImage.update({ where: { id}, data }));
});

router.delete('/:id', requireAuth, async (req, res) => {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      
        if (!id) {
          throw new AppError(400, 'Invalid Gallery ID');
        }
  await prisma.galleryImage.delete({ where: { id} });
  res.status(204).end();
});

export default router;