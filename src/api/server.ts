import cors from "cors";
import express from "express";
import { createAgentRuntime } from "../createAgent";
import { createRoutes } from "./routes";

const port = Number(process.env.PORT ?? 8787);
const runtime = await createAgentRuntime();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", createRoutes(runtime));

app.listen(port, "127.0.0.1", () => {
  console.log(`Sphere agent API listening on http://127.0.0.1:${port}`);
});
