import { decisionsPayload, json } from "./_demo";

export default function handler(_req: unknown, res: any) {
  json(res, decisionsPayload());
}
