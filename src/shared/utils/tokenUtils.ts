import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const SECRET = process.env.ACCESS_TOKEN_SECRET || "default_secret_key";

export function createSignedToken(room: string, org: string) {
  const data = `${room}|${org}`;
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("hex");
  const payload = `${room}|${org}|${signature}`;
  return Buffer.from(payload).toString("base64url");
}

export function verifySignedToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const [room, org, signature] = decoded.split("|");
    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(`${room}|${org}`)
      .digest("hex");
    if (signature !== expectedSignature) throw new Error("Invalid signature");

    return { room, org };
  } catch {
    throw new Error("Invalid or malformed token");
  }
}

export function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(";").reduce((cookies, item) => {
    const [key, value] = item.trim().split("=");
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
    return cookies;
  }, {} as Record<string, string>);
}
