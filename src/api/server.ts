import cors from "cors";
import express from "express";
import { createAgentRuntime } from "../createAgent";
import { getListenConfig } from "./listenConfig";
import { createRoutes } from "./routes";

const { host, port } = getListenConfig();
const runtime = await createAgentRuntime();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", createRoutes(runtime));

app.listen(port, host, () => {
  console.log(`Sphere agent API listening on http://${host}:${port}`);
});
