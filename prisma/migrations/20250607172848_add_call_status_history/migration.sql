-- AlterTable
ALTER TABLE "CallStatusHistory" ADD COLUMN     "assignedToId" INTEGER,
ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "CallStatusHistory" ADD CONSTRAINT "CallStatusHistory_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallStatusHistory" ADD CONSTRAINT "CallStatusHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
