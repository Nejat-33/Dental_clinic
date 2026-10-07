import { Router } from 'express';
import AuthRouter from '../modules/auth/auth.routes.js';
// import servicesRoutes from '../modules/services/services.routes.js';
// import doctorsRoutes from '../modules/doctors/doctors.routes.js';
import appointmentsRoutes from '../modules/appointments/appointment.route.js';
// import messagesRoutes from '../modules/messages/messages.routes.js';
// import testimonialsRoutes from '../modules/testimonials/testimonials.routes.js';
// import galleryRoutes from '../modules/gallery/gallery.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.use('/auth', AuthRouter);
// router.use('/services', servicesRoutes);
// router.use('/doctors', doctorsRoutes);
router.use('/appointments', appointmentsRoutes);
// router.use('/messages', messagesRoutes);
// router.use('/testimonials', testimonialsRoutes);
// router.use('/gallery', galleryRoutes);

export default router;