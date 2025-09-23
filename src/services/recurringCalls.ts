import { prismaClient as prisma } from "../prisma";
import {
  addDays,
  addWeeks,
  addMonths,
  isSameDay,
  isAfter,
  setHours,
  setMinutes,
} from "date-fns";
import { RecurringFrequency } from "@prisma/client";

export async function checkAndCreateRecurringCalls() {
  const now = new Date();

  const recurringCalls = await prisma.recurringCall.findMany({
    where: {
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: { createdCalls: true },
  });

  for (const rc of recurringCalls) {
    for (const timeStr of rc.times) {
      const [hour, minute] = timeStr.split(":").map(Number);
      const targetDate = new Date(now);
      targetDate.setHours(hour, minute, 0, 0);

      if (targetDate > now) continue;

      const day = targetDate.getDay();
      if (rc.frequency === "WEEKLY" && !rc.daysOfWeek.includes(day)) continue;

      const alreadyExists = rc.createdCalls.some(
        (call) =>
          isSameDay(call.createdAt, targetDate) &&
          call.createdAt.getHours() === hour &&
          call.createdAt.getMinutes() === minute
      );

      if (alreadyExists) continue;

      if (rc.exceptions.some((ex) => isSameDay(ex, targetDate))) continue;

      await prisma.call.create({
        data: {
          locationId: rc.locationId,
          description: rc.description,
          departmentId: rc.departmentId,
          callCategoryId: rc.callCategoryId,
          organizationId: rc.organizationId,
          createdById: rc.createdById,
          status: "OPENED",
          createdAt: targetDate,
          recurringCallId: rc.id,
        },
      });
    }
  }

  console.log("✅ Recurring calls checked and updated");
}
