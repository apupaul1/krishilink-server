import { MongoClient, ServerApiVersion } from "mongodb";
import config from "./index";

export const client = new MongoClient(config.databaseUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export const db = client.db(config.databaseName);