import { api } from '@/lib/api';
import type { Doctor, GalleryImage, Service, Testimonial } from '@/types/api';

const revalidate = { next: { revalidate: 60 } };

export const getServices = () => api<Service[]>('/services', revalidate);
export const getService = (slug: string) => api<Service>(`/services/${slug}`, revalidate);
export const getDoctors = () => api<Doctor[]>('/doctors', revalidate);
export const getTestimonials = () => api<Testimonial[]>('/testimonials', revalidate);
export const getGallery = () => api<GalleryImage[]>('/gallery', revalidate);






