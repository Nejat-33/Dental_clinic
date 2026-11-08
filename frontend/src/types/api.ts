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

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AdminUser = { id: string; name: string; email: string };

export type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type AppointmentDoctor = { id: string; name: string; specialization: string };

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
  doctor: AppointmentDoctor | null;
};

export type AppointmentListResponse = {
  appointments: Appointment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type AdminService = Service & { isActive: boolean };
export type AppointmentCalendarItem = {
  id: string;
  patientName: string;
  phone: string;
  status: AppointmentStatus;
  appointmentDate: string;
  service: { id: string; name: string };
  doctor: { id: string; name: string } | null;
};

export type AppointmentCalendarResponse = {
  from: string;
  to: string;
  appointments: AppointmentCalendarItem[];
};

export type AdminDoctor = Doctor & { isActive: boolean; isVerified: boolean };

export type AppointmentHistoryResponse = {
  assignments: {
    id: string;
    assignedAt: string;
    reason: string | null;
    doctor: { id: string; name: string };
    assignedBy: { name: string } | null;
  }[];
  events: {
    id: string;
    action: string;
    details: unknown;
    createdAt: string;
    user: { name: string } | null;
  }[];
};

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