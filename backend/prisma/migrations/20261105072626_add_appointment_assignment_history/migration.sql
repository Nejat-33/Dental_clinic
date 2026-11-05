-- CreateTable
CREATE TABLE "AppointmentAssignment" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "reason" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentAssignment_appointmentId_idx" ON "AppointmentAssignment"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentAssignment_doctorId_idx" ON "AppointmentAssignment"("doctorId");

-- CreateIndex
CREATE INDEX "AppointmentAssignment_assignedById_idx" ON "AppointmentAssignment"("assignedById");

-- CreateIndex
CREATE INDEX "AppointmentAssignment_assignedAt_idx" ON "AppointmentAssignment"("assignedAt");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_idx" ON "Appointment"("doctorId");

-- AddForeignKey
ALTER TABLE "AppointmentAssignment" ADD CONSTRAINT "AppointmentAssignment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAssignment" ADD CONSTRAINT "AppointmentAssignment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAssignment" ADD CONSTRAINT "AppointmentAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
