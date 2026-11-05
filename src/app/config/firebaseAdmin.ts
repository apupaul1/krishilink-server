import { cert, getApps, initializeApp } from "firebase-admin";

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, "base64").toString(
    "utf-8",
  ),
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
