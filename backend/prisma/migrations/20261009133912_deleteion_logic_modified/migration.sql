-- DropIndex
DROP INDEX "Message_status_idx";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Message_deletedAt_idx" ON "Message"("deletedAt");
