import { json, methodNotAllowed, serverDemoUnavailablePayload } from "../_demo";

export default function handler(req: { method?: string }, res: any) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }
  json(res, serverDemoUnavailablePayload(), 403);
}
