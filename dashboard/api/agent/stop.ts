import { json, methodNotAllowed } from "../_demo";

export default function handler(req: { method?: string }, res: any) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }
  json(res, {
    running: false,
    mode: "dry-run",
    message: "Vercel mock API accepted stop. No autonomous backend was running."
  });
}
