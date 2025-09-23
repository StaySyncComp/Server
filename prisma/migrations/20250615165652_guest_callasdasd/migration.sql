-- DropForeignKey
ALTER TABLE "CallStatusHistory" DROP CONSTRAINT "CallStatusHistory_changedById_fkey";

-- AlterTable
ALTER TABLE "CallStatusHistory" ALTER COLUMN "changedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CallStatusHistory" ADD CONSTRAINT "CallStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
