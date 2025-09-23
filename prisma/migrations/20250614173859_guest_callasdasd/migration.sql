-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_createdById_fkey";

-- AlterTable
ALTER TABLE "Call" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
