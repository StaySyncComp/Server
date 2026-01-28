-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('vacant_dirty', 'vacant_clean', 'occupied_clean', 'occupied_dirty', 'do_not_disturb');

-- CreateEnum
CREATE TYPE "RoomPriority" AS ENUM ('low', 'normal', 'high');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Resource" ADD VALUE 'areas';
ALTER TYPE "Resource" ADD VALUE 'cleaning';

-- CreateTable
CREATE TABLE "room_states" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'vacant_dirty',
    "priority" "RoomPriority" NOT NULL DEFAULT 'normal',
    "assignedToId" INTEGER,
    "lastCleanedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_state_history" (
    "id" SERIAL NOT NULL,
    "roomStateId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_state_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icon_vectors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "icon_name" TEXT,
    "tags" TEXT[],
    "keyword" TEXT,
    "file" TEXT,
    "embedding" vector,

    CONSTRAINT "icon_vectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interested_people" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interested_people_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_states_locationId_key" ON "room_states"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "interested_people_email_key" ON "interested_people"("email");

-- AddForeignKey
ALTER TABLE "room_states" ADD CONSTRAINT "room_states_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_states" ADD CONSTRAINT "room_states_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_state_history" ADD CONSTRAINT "room_state_history_roomStateId_fkey" FOREIGN KEY ("roomStateId") REFERENCES "room_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_state_history" ADD CONSTRAINT "room_state_history_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
