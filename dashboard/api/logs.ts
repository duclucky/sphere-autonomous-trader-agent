import { json, logsPayload } from "./_demo";

export default function handler(_req: unknown, res: any) {
  json(res, logsPayload());
}
