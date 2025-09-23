/*
  Warnings:

  - You are about to drop the column `location` on the `recurringCalls` table. All the data in the column will be lost.
  - You are about to drop the column `roomNumber` on the `recurringCalls` table. All the data in the column will be lost.
  - Added the required column `locationId` to the `recurringCalls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "recurringCalls" DROP COLUMN "location",
DROP COLUMN "roomNumber",
ADD COLUMN     "locationId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "recurringCalls" ADD CONSTRAINT "recurringCalls_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
