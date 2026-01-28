import cron from "node-cron";
import { checkAndCreateRecurringCalls } from "../services/recurringCalls";
import { updateRoomStatusesMidnight } from "./roomStatusJob";

cron.schedule("*/5 * * * *", async () => {
  console.log("🔁 Running recurring calls check...");
  await checkAndCreateRecurringCalls();
});

cron.schedule("0 0 * * *", async () => {
  await updateRoomStatusesMidnight();
});
