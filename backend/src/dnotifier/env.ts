// dnotifier/env.ts
import "dotenv/config";


const DNOTIFIER_APP_ID = process.env.DNOTIFIER_APP_ID;
const DNOTIFIER_SECRET = process.env.DNOTIFIER_SECRET;
const ORCHESTRATOR_USER_ID = process.env.DNOTIFIER_ORCHESTRATOR_USER_ID ?? "svc-healthcare-orchestrator";
const MONGODB_URI: string = (() => {
  const value = process.env.MONGODB_URI;
  if (!value) throw new Error("MONGODB_URI must be set (MongoDB Atlas connection string)");
  return value;
})();
if (!DNOTIFIER_APP_ID || !DNOTIFIER_SECRET) {
  throw new Error("DNOTIFIER_APP_ID and DNOTIFIER_SECRET must be set");
}
export { MONGODB_URI };
export { DNOTIFIER_APP_ID, DNOTIFIER_SECRET, ORCHESTRATOR_USER_ID };