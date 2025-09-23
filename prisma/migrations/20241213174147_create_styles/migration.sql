/*
  Warnings:

  - You are about to drop the column `custom_styles` on the `organizations` table. All the data in the column will be lost.
  - Added the required column `customStyles` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userType` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('EMPLOYER', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "custom_styles",
ADD COLUMN     "customStyles" JSONB NOT NULL,
ADD COLUMN     "userType" "UserType" NOT NULL;
