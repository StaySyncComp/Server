import cron from "node-cron";
import { checkAndCreateRecurringCalls } from "../services/recurringCalls";

cron.schedule("*/5 * * * *", async () => {
  console.log("🔁 Running recurring calls check...");
  await checkAndCreateRecurringCalls();
});
