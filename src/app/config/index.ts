import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL!,
  databaseName: process.env.DATABASE_NAME!,
  firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!,
};

export default config;
