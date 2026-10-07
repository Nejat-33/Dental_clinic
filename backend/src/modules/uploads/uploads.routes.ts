// src/modules/uploads/uploads.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AppError } from '../../lib/AppError.js';
import { deleteImage, publicIdFromUrl, uploadImage } from '../../lib/cloudinary.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// Check real file bytes instead of trusting the client's mimetype or filename
function isImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpeg || png || webp;
}

const deleteSchema = z.object({ url: z.url() });

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) throw new AppError(400, 'No image provided (form field name: image)');
  if (!isImage(req.file.buffer)) throw new AppError(400, 'Only JPEG, PNG or WebP images are allowed');

  const result = await uploadImage(req.file.buffer);
  res.status(201).json({ url: result.secure_url, publicId: result.public_id });
});

// Removes an image we uploaded. Refuses URLs that aren't from our Cloudinary folder.
router.delete('/', requireAuth, validateBody(deleteSchema), async (_req, res) => {
  const { url } = res.locals.body as z.infer<typeof deleteSchema>;
  const publicId = publicIdFromUrl(url);
  if (!publicId) throw new AppError(400, 'Not an image from this clinic’s storage');

  await deleteImage(publicId);
  res.status(204).end();
});

export default router;