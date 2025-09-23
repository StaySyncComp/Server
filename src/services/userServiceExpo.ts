// services/userService.ts
import { prismaClient } from "../prisma";
export async function getUserPushTokens(userId: number): Promise<string[]> {
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { expoPushToken: true },
  });

  return user?.expoPushToken || [];
}
