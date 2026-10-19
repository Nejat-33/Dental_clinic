export type Service = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  imageUrl: string | null;
  duration: number | null;
};

export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  bio: string | null;
  education: string | null;
  experience: string | null;
  languages: string | null;
  imageUrl: string | null;
};

export type Testimonial = {
  id: string;
  patientName: string;
  content: string;
  rating: number;
  service: string | null;
  createdAt: string;
};

export type GalleryImage = {
  id: string;
  title: string | null;
  imageUrl: string;
  category: string | null;
};

export type Availability = {
  date: string;
  slots: { time: string; available: boolean }[];
};

export type BookingConfirmation = {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  appointmentDate: string;
  service: { name: string };
};

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type AdminUser = { id: string; name: string; email: string };

export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type Appointment = {
  id: string;
  patientName: string;
  phone: string;
  email: string | null;
  appointmentDate: string;
  message: string | null;
  status: AppointmentStatus;
  createdAt: string;
  service: { id: string; name: string };
};

export type AdminService = Service & { isActive: boolean };
export type AdminDoctor = Doctor & { isActive: boolean };

export type MessageStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export type Message = {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  subject: string | null;
  message: string;
  status: MessageStatus;
  createdAt: string;
  deletedAt: string | null;
};

export type AdminTestimonial = Testimonial & { isPublished: boolean };

export type AdminGalleryImage = GalleryImage & { isPublished: boolean };