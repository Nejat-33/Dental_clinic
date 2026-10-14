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