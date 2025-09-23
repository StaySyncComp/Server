-- DropForeignKey
ALTER TABLE "CallMessageAttachment" DROP CONSTRAINT "CallMessageAttachment_messageId_fkey";

-- AddForeignKey
ALTER TABLE "CallMessageAttachment" ADD CONSTRAINT "CallMessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CallMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
