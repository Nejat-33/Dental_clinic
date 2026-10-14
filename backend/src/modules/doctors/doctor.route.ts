
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { AppError } from '../../lib/AppError.js';


const router = Router();

const baseSchema = z.object({
  name: z.string().trim().min(2).max(100),
  specialization: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(3000).nullish(),
  education: z.string().trim().max(1000).nullish(),
  experience: z.string().trim().max(1000).nullish(),
  languages: z.string().trim().max(200).nullish(),
  imageUrl: z.url().nullish(),
});

const createSchema = baseSchema.extend({ isActive: z.boolean().default(true) });

const updateSchema = baseSchema
  .extend({ isActive: z.boolean() })
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'No fields to update');


router.get('/', async (_req, res) => {
  res.json(
    await prisma.doctor.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    }),
  );
});



router.get('/all', requireAuth, async (_req, res) => {
  res.json(await prisma.doctor.findMany({ orderBy: { createdAt: 'asc' } }));
});

router.post('/', requireAuth, validateBody(createSchema), async (_req, res) => {
  const data = res.locals.body as z.infer<typeof createSchema>;

  const doctor = await prisma.doctor.create({
    data: {
      name: data.name,
      specialization: data.specialization,
      isActive: data.isActive ?? true,
      education: data.education ?? null,
      experience: data.experience ?? null,
      imageUrl: data.imageUrl ?? null,
    },
  });

  res.status(201).json(doctor);
});

router.patch('/:id', requireAuth, validateBody(updateSchema), async (req, res) => {
  const data = res.locals.body as z.infer<typeof updateSchema>;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
      if (!id) {
        throw new AppError(400, 'Invalid doctor ID');
      }
  res.json(await prisma.doctor.update({ where: { id }, data }));
});

router.delete('/:id', requireAuth, async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        
          if (!id) {
            throw new AppError(400, 'Invalid doctor ID');
          }
  await prisma.doctor.delete({ where: { id} });
  res.status(204).end();
});

 const doctorRouter = router
export default doctorRouter;