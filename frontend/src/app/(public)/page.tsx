import { getDoctors, getGallery, getServices, getTestimonials } from '@/lib/queries';
import type { Doctor, GalleryImage, Service, Testimonial } from '@/types/api';
import HomeExperience from '@/components/sections/home-experience';

export default async function HomePage() {
  const [services, doctors, testimonials, gallery] = await Promise.all([
    getServices().catch(() => [] as Service[]),
    getDoctors().catch(() => [] as Doctor[]),
    getTestimonials().catch(() => [] as Testimonial[]),
    getGallery().catch(() => [] as GalleryImage[]),
  ]);

  return (
    <HomeExperience
      services={services}
      doctors={doctors}
      testimonials={testimonials}
      gallery={gallery}
    />
  );
}
