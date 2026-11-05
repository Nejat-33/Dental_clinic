// src/modules/services/services.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/AppError.js';
import { slugify } from '../../lib/slugify.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const baseSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().regex(slugRegex, 'Lowercase letters, numbers and dashes only').optional(),
  shortDescription: z.string().trim().max(200).nullish(),
  description: z.string().trim().min(10).max(5000),
  imageUrl: z.url().nullish(),
  duration: z.number().int().min(5).max(480).nullish(),
});

const createSchema = baseSchema.extend({ isActive: z.boolean().default(true) });


const updateSchema = baseSchema
  .extend({ isActive: z.boolean() })
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'No fields to update');


router.get('/', async (_req, res) => {
  res.json(
    await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        imageUrl: true,
        duration: true,
      },
    }),
  );
});

router.get('/all', requireAuth, async (_req, res) => {
  res.json(await prisma.service.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.get('/:slug', async (req, res) => {
  const service = await prisma.service.findFirst({
    where: { slug: req.params.slug, isActive: true },
  });
  if (!service) throw new AppError(404, 'Service not found');
  res.json(service);
});


router.post('/', requireAuth, validateBody(createSchema), async (_req, res) => {
  const { slug, ...rest } = res.locals.body as z.infer<typeof createSchema>;
  const finalSlug = slug ?? slugify(rest.name);
  if (!finalSlug) throw new AppError(400, 'Could not generate a slug from the name, please provide one');

  res.status(201).json(await prisma.service.create({ data: { ...rest, slug: finalSlug } }));
});

router.patch('/:id', requireAuth, validateBody(updateSchema), async (req, res) => {
  const data = res.locals.body as z.infer<typeof updateSchema>;
   const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
      if (!id) {
        throw new AppError(400, 'Invalid service ID');
      }
  res.json(await prisma.service.update({ where: { id}, data }));
});

router.delete('/:id', requireAuth, async (req, res) => {
   const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
      if (!id) {
        throw new AppError(400, 'Invalid Service ID');
      }
  await prisma.service.delete({ where: { id} });
  res.status(204).end();
});

const serviceRouter = router

export default serviceRouter;