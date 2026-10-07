import { Router } from 'express';
import AuthRouter from '../modules/auth/auth.routes.js';
import servicesRoutes from '../modules/services/services.routes.js';
import doctorRouter from '../modules/doctors/doctor.route.js';
import appointmentsRoutes from '../modules/appointments/appointment.route.js';
import messagesRoutes from '../modules/messages/messages.route.js';
import testimonialsRoutes from '../modules/testimonals/testmonal.route.js';
import galleryRoutes from '../modules/gallery/gallery.router.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.use('/auth', AuthRouter);
router.use('/services', servicesRoutes);
router.use('/doctors', doctorRouter);
router.use('/appointments', appointmentsRoutes);
router.use('/messages', messagesRoutes);
router.use('/testimonials', testimonialsRoutes);
router.use('/gallery', galleryRoutes);

const apiRouter = Router()
export default apiRouter