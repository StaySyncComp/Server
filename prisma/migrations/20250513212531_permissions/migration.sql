/*
  Warnings:

  - You are about to drop the column `title` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Call` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expectedTime` to the `callCategories` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Action" AS ENUM ('view', 'update', 'delete', 'create');

-- CreateEnum
CREATE TYPE "Resource" AS ENUM ('users', 'calls', 'callCategories', 'site', 'roles', 'reports', 'departments');

-- CreateEnum
CREATE TYPE "ScopeLevel" AS ENUM ('any', 'own', 'none');

-- DropForeignKey
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_roleId_fkey";

-- AlterTable
ALTER TABLE "Call" DROP COLUMN "title",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "callCategories" ADD COLUMN     "expectedTime" INTEGER NOT NULL;

-- DropTable
DROP TABLE "permissions";

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "resource" "Resource" NOT NULL,
    "action" "Action" NOT NULL,
    "scope" "ScopeLevel" NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
