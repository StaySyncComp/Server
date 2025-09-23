-- CreateTable
CREATE TABLE "CallMessageAttachment" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallMessageAttachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CallMessageAttachment" ADD CONSTRAINT "CallMessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CallMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
