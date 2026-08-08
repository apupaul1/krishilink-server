import { cert, getApps, initializeApp } from "firebase-admin/app";
import serviceAccount from "../../firebase/serviceAccountKey.json";

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
  });
}