import { Router } from 'express';
import AuthRouter from '../modules/auth/auth.routes.js';
import serviceRouter from '../modules/services/services.routes.js';
import doctorRouter from '../modules/doctors/doctor.route.js';
import appointmentsRoutes from '../modules/appointments/appointment.route.js';
import messagesRoutes from '../modules/messages/messages.route.js';
import testimonialsRoutes from '../modules/testimonals/testmonal.route.js';
import galleryRouter from '../modules/gallery/gallery.router.js';
import patientRouter from '../modules/patients/patient.routes.js';
import visitRouter from '../modules/visit/visit.routes.js';
import userRouter from '../modules/users/user.routes.js';
import doctorDocumentRouter from '../modules/doctors/doctor-document.routes.js';
import invoiceRoutes from '../modules/invoices/invoice.route.js';
import financialReportRoutes from '../modules/reports/financial-report.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import notificationRoutes from '../modules/notifications/notification.route.js';


const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.use('/auth', AuthRouter);
router.use('/services', serviceRouter);
router.use('/doctors', doctorRouter);
router.use('/appointments', appointmentsRoutes);
router.use('/patients', patientRouter);
router.use('/messages', messagesRoutes);
router.use('/testimonials', testimonialsRoutes);
router.use('/gallery', galleryRouter);
router.use('/visits', visitRouter);
router.use('/users', userRouter);
router.use('/doctor-documents', doctorDocumentRouter);
router.use('/invoices', invoiceRoutes);
router.use('/reports', financialReportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

export default router