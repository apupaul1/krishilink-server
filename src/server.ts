import app from "./app";
import config from "./app/config";
import { client } from "./app/config/db";

const startServer = async () => {
  try {
    await client.connect();

    console.log("MongoDB Connected");

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error(error);
  }
};

startServer();