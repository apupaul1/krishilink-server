import express from "express";
import cors from "cors";
import routes from "./app/routes";
import { notFound } from "./app/middlewares/notFound";
import { handleError } from "./app/errors/handleError";


const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("KrishiLink Server Running");
});

app.use("/api/v1", routes);

app.use(notFound);
app.use(handleError);

export default app;
