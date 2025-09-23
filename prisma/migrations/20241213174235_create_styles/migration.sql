/*
  Warnings:

  - You are about to drop the column `userType` on the `organizations` table. All the data in the column will be lost.
  - Added the required column `userType` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "userType";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "userType" "UserType" NOT NULL;
