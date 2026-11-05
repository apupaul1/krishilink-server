import app from "./app.js";
import { client } from "./app/config/db.js";
import config from "./app/config/index.js";

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
