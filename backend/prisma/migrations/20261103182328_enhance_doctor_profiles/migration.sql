-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languages" TEXT[];

-- CreateIndex
CREATE INDEX "Doctor_isActive_isPublished_idx" ON "Doctor"("isActive", "isPublished");

-- CreateIndex
CREATE INDEX "Doctor_name_idx" ON "Doctor"("name");
