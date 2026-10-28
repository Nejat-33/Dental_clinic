import bcrypt from "bcrypt";
import { PrismaClient, AppointmentStatus, MessageStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config'; 


const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});


const prisma = new PrismaClient({ adapter });



async function main() {
  console.log("🌱 Starting database seed...");

  const passwordHash = await bcrypt.hash("Admin@123", 12);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@dentalclinic.com",
    },
    update: {},
    create: {
      name: "Clinic Administrator",
      email: "admin@dentalclinic.com",
      passwordHash,
    },
  });

  console.log(`Admin created: ${admin.email}`);


  const services = await Promise.all([
    prisma.service.upsert({
      where: { slug: "general-dentistry" },
      update: {},
      create: {
        name: "General Dentistry",
        slug: "general-dentistry",
        shortDescription:
          "Comprehensive dental care for maintaining healthy teeth and gums.",
        description:
          "Our general dentistry services focus on preventive care, diagnosis, and treatment of common dental conditions. We provide professional examinations and personalized treatment plans.",
        duration: 45,
        imageUrl: "/images/services/general-dentistry.jpg",
        isActive: true,
      },
    }),

    prisma.service.upsert({
      where: { slug: "teeth-cleaning" },
      update: {},
      create: {
        name: "Teeth Cleaning",
        slug: "teeth-cleaning",
        shortDescription:
          "Professional cleaning to keep your teeth healthy and your smile fresh.",
        description:
          "Professional dental cleaning helps remove plaque and tartar that regular brushing may not completely eliminate. Our team provides careful cleaning and guidance for maintaining oral hygiene.",
        duration: 45,
        imageUrl: "/images/services/teeth-cleaning.jpg",
        isActive: true,
      },
    }),

    prisma.service.upsert({
      where: { slug: "dental-filling" },
      update: {},
      create: {
        name: "Dental Filling",
        slug: "dental-filling",
        shortDescription:
          "Treatment to restore teeth affected by cavities and decay.",
        description:
          "Dental fillings restore teeth affected by decay and help prevent further damage. Our dentists examine the affected tooth and recommend an appropriate treatment.",
        duration: 60,
        imageUrl: "/images/services/dental-filling.jpg",
        isActive: true,
      },
    }),

    prisma.service.upsert({
      where: { slug: "teeth-whitening" },
      update: {},
      create: {
        name: "Teeth Whitening",
        slug: "teeth-whitening",
        shortDescription:
          "Professional cosmetic treatment for a brighter smile.",
        description:
          "Our professional teeth whitening service is designed to improve the appearance of stained or discolored teeth while following appropriate dental care procedures.",
        duration: 60,
        imageUrl: "/images/services/teeth-whitening.jpg",
        isActive: true,
      },
    }),

    prisma.service.upsert({
      where: { slug: "root-canal-treatment" },
      update: {},
      create: {
        name: "Root Canal Treatment",
        slug: "root-canal-treatment",
        shortDescription:
          "Treatment designed to save and restore an infected or damaged tooth.",
        description:
          "Root canal treatment addresses infection or inflammation inside a tooth. Our dentists evaluate the condition and develop an appropriate treatment plan.",
        duration: 90,
        imageUrl: "/images/services/root-canal.jpg",
        isActive: true,
      },
    }),

    prisma.service.upsert({
      where: { slug: "dental-crowns" },
      update: {},
      create: {
        name: "Dental Crowns",
        slug: "dental-crowns",
        shortDescription:
          "Restorative treatment for damaged or weakened teeth.",
        description:
          "Dental crowns can help restore the shape, strength, and appearance of damaged teeth. Treatment begins with an examination and personalized recommendation.",
        duration: 90,
        imageUrl: "/images/services/dental-crowns.jpg",
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${services.length} services created`);

  // --------------------------------------------------
  // 3. DOCTORS
  // --------------------------------------------------

  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        name: "Dr. Ahmed Hassan",
        specialization: "General & Restorative Dentistry",
        education: "Doctor of Dental Medicine",
        experience: "8+ years of clinical experience",
        imageUrl: "/images/doctors/dr-ahmed.jpg",
        isActive: true,
      },
    }),

    prisma.doctor.create({
      data: {
        name: "Dr. Sara Mohammed",
        specialization: "Cosmetic Dentistry",
        education: "Doctor of Dental Medicine",
        experience: "6+ years of clinical experience",
        imageUrl: "/images/doctors/dr-sara.jpg",
        isActive: true,
      },
    }),

    prisma.doctor.create({
      data: {
        name: "Dr. Daniel Tesfaye",
        specialization: "Endodontics & Restorative Dentistry",
        education: "Doctor of Dental Medicine",
        experience: "10+ years of clinical experience",
        imageUrl: "/images/doctors/dr-daniel.jpg",
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${doctors.length} doctors created`);

  // --------------------------------------------------
  // 4. TESTIMONIALS
  // --------------------------------------------------

  const testimonials = [
    {
      patientName: "Mariam A.",
      content:
        "The staff were professional and welcoming. The entire appointment was handled smoothly and I felt comfortable throughout the treatment.",
      rating: 5,
      service: "Teeth Cleaning",
      isPublished: true,
    },
    {
      patientName: "Yonas K.",
      content:
        "I had a very good experience. The dentist explained the treatment clearly and answered all of my questions.",
      rating: 5,
      service: "General Dentistry",
      isPublished: true,
    },
    {
      patientName: "Hana M.",
      content:
        "The clinic was clean and the team was friendly. Booking an appointment was also very convenient.",
      rating: 4,
      service: "Dental Filling",
      isPublished: true,
    },
    {
      patientName: "Samuel T.",
      content:
        "I appreciated how carefully the dentist explained my treatment options before starting the procedure.",
      rating: 5,
      service: "Root Canal Treatment",
      isPublished: true,
    },
    {
      patientName: "Liya G.",
      content:
        "Very professional service and a welcoming environment. I would recommend the clinic to others.",
      rating: 5,
      service: "Teeth Whitening",
      isPublished: false,
    },
  ];

  for (const testimonial of testimonials) {
    await prisma.testimonial.create({
      data: testimonial,
    });
  }

  console.log(`✅ ${testimonials.length} testimonials created`);

  // --------------------------------------------------
  // 5. GALLERY
  // --------------------------------------------------

  const galleryImages = [
    {
      title: "Modern Reception",
      imageUrl: "/images/gallery/reception.jpg",
      category: "Clinic",
      isPublished: true,
    },
    {
      title: "Treatment Room",
      imageUrl: "/images/gallery/treatment-room.jpg",
      category: "Clinic",
      isPublished: true,
    },
    {
      title: "Dental Equipment",
      imageUrl: "/images/gallery/equipment.jpg",
      category: "Equipment",
      isPublished: true,
    },
    {
      title: "Comfortable Waiting Area",
      imageUrl: "/images/gallery/waiting-area.jpg",
      category: "Clinic",
      isPublished: true,
    },
    {
      title: "Our Dental Team",
      imageUrl: "/images/gallery/dental-team.jpg",
      category: "Team",
      isPublished: true,
    },
    {
      title: "Patient Care",
      imageUrl: "/images/gallery/patient-care.jpg",
      category: "Treatment",
      isPublished: false,
    },
  ];

  for (const image of galleryImages) {
    await prisma.galleryImage.create({
      data: image,
    });
  }

  console.log(`✅ ${galleryImages.length} gallery images created`);

  // --------------------------------------------------
  // 6. APPOINTMENTS
  // --------------------------------------------------

  const generalDentistry = services.find(
    (service) => service.slug === "general-dentistry"
  );

  const teethCleaning = services.find(
    (service) => service.slug === "teeth-cleaning"
  );

  const dentalFilling = services.find(
    (service) => service.slug === "dental-filling"
  );

  if (!generalDentistry || !teethCleaning || !dentalFilling) {
    throw new Error("Required services were not found.");
  }

  const appointments = [
    {
      patientName: "Abebe Kebede",
      phone: "0911000001",
      email: "abebe@example.com",
      appointmentDate: new Date("2026-10-12T09:30:00+03:00"),
      message: "I would like a general dental examination.",
      status: AppointmentStatus.PENDING,
      serviceId: generalDentistry.id,
    },
    {
      patientName: "Fatima Ali",
      phone: "0922000002",
      email: "fatima@example.com",
      appointmentDate: new Date("2026-10-13T11:00:00+03:00"),
      message: "I would like to book a professional teeth cleaning.",
      status: AppointmentStatus.CONFIRMED,
      serviceId: teethCleaning.id,
    },
    {
      patientName: "Dawit Mekonnen",
      phone: "0933000003",
      email: null,
      appointmentDate: new Date("2026-10-14T14:00:00+03:00"),
      message: "I have a tooth that has been painful for several days.",
      status: AppointmentStatus.CANCELLED,
      serviceId: dentalFilling.id,
    },
  ];

  for (const appointment of appointments) {
    await prisma.appointment.create({
      data: appointment,
    });
  }

  console.log(`✅ ${appointments.length} appointments created`);

  // --------------------------------------------------
  // 7. CONTACT MESSAGES
  // --------------------------------------------------

  const messages = [
    {
      name: "Meron Bekele",
      phone: "0944000004",
      email: "meron@example.com",
      subject: "Question about dental services",
      message:
        "I would like to know more about the dental services available at the clinic.",
      status: MessageStatus.UNREAD,
    },
    {
      name: "Abdulrahman Omar",
      phone: "0955000005",
      email: "abdulrahman@example.com",
      subject: "Appointment question",
      message:
        "Do you have appointments available during the afternoon?",
      status: MessageStatus.READ,
    },
    {
      name: "Selam Tesfaye",
      phone: "0966000006",
      email: "selam@example.com",
      subject: "General inquiry",
      message:
        "I would like to know more about your clinic and available treatments.",
      status: MessageStatus.ARCHIVED,
    },
  ];

  for (const message of messages) {
    await prisma.message.create({
      data: message,
    });
  }

  console.log(`✅ ${messages.length} contact messages created`);

  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });