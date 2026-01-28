require("dotenv").config();
import express, { Express } from "express";
import { usersRouter } from "./routes/user.routes";
import { authRouter } from "./routes/auth.routes";
import cookieParser from "cookie-parser";
import cors from "cors"; // Import the CORS middleware
import { organizationRouter } from "./routes/organization.routes";
import { departmentRouter } from "./routes/departments.routes";
import { locationRouter } from "./routes/locations.routes";
import { rolesRouter } from "./routes/role.routes";
import { permissionRouter } from "./routes/permission.routes";
import { aiRouter } from "./routes/ai.routes";
import { reportsRouter } from "./routes/reports.routes";
import { areasRouter } from "./routes/areas.routes";
import "./jobs/recurringJob";
import { Server } from "socket.io";
import http from "http";
import { initializeSockets } from "./sockets";
import { callsRouter } from "./routes/calls/calls.routes";
import guestRouter from "./routes/guest.routes";
import { IconsRouter } from "./routes/Icons.routes";

const app: Express = express();
const port: Number = Number(process.env.PORT) || 3101;

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/organizations", organizationRouter);
app.use("/departments", departmentRouter);
app.use("/locations", locationRouter);
app.use("/calls", callsRouter);
app.use("/roles", rolesRouter);
app.use("/permissions", permissionRouter);
app.use("/ai", aiRouter);
app.use("/icons", IconsRouter);
app.use("/reports", reportsRouter);
app.use("/areas", areasRouter);
import cleaningRouter from "./routes/cleaning.routes";

app.use("/guest", guestRouter);
app.use("/cleaning", cleaningRouter);

// Health check endpoint
// @ts-ignore
app.get("/healthz", (req, res) => res.send("Server is live"));
// @ts-ignore
app.get("/", (req, res) => res.send("Server is live"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, credentials: true },
});

app.set("io", io);
initializeSockets(io);

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
