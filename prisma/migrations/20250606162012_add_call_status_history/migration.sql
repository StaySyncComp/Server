-- CreateTable
CREATE TABLE "CallStatusHistory" (
    "id" SERIAL NOT NULL,
    "callId" INTEGER NOT NULL,
    "fromStatus" "CallStatus",
    "toStatus" "CallStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" INTEGER NOT NULL,

    CONSTRAINT "CallStatusHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CallStatusHistory" ADD CONSTRAINT "CallStatusHistory_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallStatusHistory" ADD CONSTRAINT "CallStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
