import { createSignedToken } from "./tokenUtils";

const room = process.argv[2];
const orgId = process.argv[3];

if (!room || !orgId) {
  console.error("Usage: npm run create-token <room> <orgId>");
  process.exit(1);
}

console.log("Token:", createSignedToken(room, orgId));
