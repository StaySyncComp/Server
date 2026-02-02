import { Server } from "socket.io";
import { setupSocketHandlers } from "./socketHandler";
import { socketAuthMiddleware } from "../middlewares/JTW.middleware";

export function initializeSockets(io: Server) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log("Socket connected:", socket.id, "User:", user.username);
    setupSocketHandlers(io, socket);
  });
}
