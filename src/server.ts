require("dotenv").config();
import express, { Express } from "express";
import { usersRouter } from "./modules/users/users.routes";
import { authRouter } from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";
import cors from "cors"; // Import the CORS middleware
import { organizationRouter } from "./modules/organizations/organization.routes";
import { departmentRouter } from "./modules/departments/departments.routes";
import { locationRouter } from "./modules/locations/locations.routes";
import { rolesRouter } from "./modules/roles/role.routes";
import { permissionRouter } from "./modules/permissions/permission.routes";
import { aiRouter } from "./modules/ai/ai.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { areasRouter } from "./modules/locations/areas.routes";
import "./shared/jobs/recurringJob";
import { Server } from "socket.io";
import http from "http";
import { initializeSockets } from "./shared/sockets";
import { callsRouter } from "./modules/calls/calls.routes";
import guestRouter from "./modules/users/guest.routes";
import { IconsRouter } from "./modules/icons/icons.routes";

const app: Express = express();
const port: Number = Number(process.env.PORT) || 3101;

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
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
import cleaningRouter from "./modules/cleaning/cleaning.routes";

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
