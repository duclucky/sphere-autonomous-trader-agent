import { json, negotiationsPayload } from "./_demo";

export default function handler(_req: unknown, res: any) {
  json(res, negotiationsPayload());
}
