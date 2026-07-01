import { json, methodNotAllowed } from "../_demo";

export default function handler(req: { method?: string }, res: any) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }
  json(res, {
    running: true,
    mode: "dry-run",
    message: "Vercel mock API accepted start. No autonomous backend was launched."
  });
}
