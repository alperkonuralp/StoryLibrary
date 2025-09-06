-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Story_deletedAt_idx" ON "Story"("deletedAt");

-- CreateIndex
CREATE INDEX "Story_status_deletedAt_idx" ON "Story"("status", "deletedAt");
