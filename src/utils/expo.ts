import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { getUserPushTokens } from "../services/userServiceExpo";

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
}

const expo = new Expo();

export async function sendPushNotifications(
  tokens: string[],
  message: PushMessage
): Promise<void> {
  if (!tokens || tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    sound: "default",
    title: message.title,
    body: message.body,
    data: message.data || {},
  }));

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(
        chunk
      );
      console.log("Expo push tickets:", tickets);
    } catch (error) {
      console.error("Error sending push notifications:", error);
    }
  }
}

// helpers/notifyUser.ts

export async function notifyUser(
  userId: number,
  message: PushMessage
): Promise<void> {
  const tokens = await getUserPushTokens(userId);
  if (tokens.length === 0) {
    console.log(`No push tokens found for user ${userId}`);
    return;
  }
  await sendPushNotifications(tokens, message);
}

export async function notifyMultipleUsers(
  userIds: number[],
  message: PushMessage
): Promise<void> {
  await Promise.all(userIds.map((userId) => notifyUser(userId, message)));
}
