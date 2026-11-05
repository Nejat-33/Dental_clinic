-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT');

-- CreateEnum
CREATE TYPE "DoctorDocumentType" AS ENUM ('PROFESSIONAL_LICENSE', 'EDUCATION_CERTIFICATE', 'SPECIALTY_CERTIFICATE', 'IDENTITY_DOCUMENT', 'EMPLOYMENT_AGREEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "employmentStartDate" TIMESTAMP(3),
ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "licenseAuthority" TEXT,
ADD COLUMN     "licenseExpiryDate" TIMESTAMP(3),
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- CreateTable
CREATE TABLE "DoctorDocument" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "documentType" "DoctorDocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "uploadedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "DoctorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorDocument_doctorId_idx" ON "DoctorDocument"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorDocument_status_idx" ON "DoctorDocument"("status");

-- CreateIndex
CREATE INDEX "DoctorDocument_documentType_idx" ON "DoctorDocument"("documentType");

-- CreateIndex
CREATE INDEX "Doctor_isVerified_idx" ON "Doctor"("isVerified");

-- CreateIndex
CREATE INDEX "Doctor_phone_idx" ON "Doctor"("phone");

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorDocument" ADD CONSTRAINT "DoctorDocument_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorDocument" ADD CONSTRAINT "DoctorDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorDocument" ADD CONSTRAINT "DoctorDocument_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
