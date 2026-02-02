import { Server, Socket } from "socket.io";
import { prismaClient } from "../prisma";
import { CallMessageAttachment } from "@prisma/client";

export const setupSocketHandlers = (io: Server, socket: Socket) => {
  socket.on("joinCallRoom", (callId) => {
    console.log(`Socket ${socket.id} joining call room:`, callId);
    socket.join(`call-${callId}`);
  });

  socket.on("leaveCallRoom", (callId) => {
    console.log(`Socket ${socket.id} leaving call room:`, callId);
    socket.leave(`call-${callId}`);
  });

  socket.on("call:update", (updatedCall) => {
    console.log("Received call update Server WebSockets");
    // attachPermissionScopesSocket("call", "update")(socket);

    console.log("Emitted call update to authorized clients");
  });

  socket.on(
    "call:sendMessage",
    async ({ callId, userId, organizationId, content, attachments = [] }) => {
      console.log(attachments, "attachments");

      if (!callId || !userId || !organizationId) {
        console.error("Missing callId, userId, or organizationId", {
          callId,
          userId,
          organizationId,
        });
        return;
      }

      try {
        // Step 1: Create the message
        const message = await prismaClient.callMessage.create({
          data: {
            content: content || null, // allow null content
            call: { connect: { id: callId } },
            user: { connect: { id: userId } },
            organization: { connect: { id: organizationId } },
          },
          include: {
            user: true,
          },
        });

        // Step 2: Create any attachments (if any)
        if (attachments.length > 0) {
          await prismaClient.callMessageAttachment.createMany({
            data: attachments.map((att: CallMessageAttachment) => ({
              messageId: message.id,
              fileUrl: att.fileUrl,
              fileType: att.fileType,
              fileName: att.fileName,
            })),
          });

          // Optional: If you want to fetch them to include in emit
          const fullAttachments =
            await prismaClient.callMessageAttachment.findMany({
              where: { messageId: message.id },
            });

          // Step 3: Emit full message + attachments
          io.to(`call-${callId}`).emit("call:message", {
            ...message,
            CallMessageAttachment: fullAttachments,
          });
        } else {
          // No attachments, emit just message
          io.to(`call-${callId}`).emit("call:message", {
            ...message,
            CallMessageAttachment: [],
          });
        }
      } catch (err) {
        console.error("Error creating message:", err);
      }
    }
  );

  socket.on("sendMessage", (data) => {
    console.log("Received message:", data);
    // You can also use emitToAuthorizedSockets here if needed
  });
};
