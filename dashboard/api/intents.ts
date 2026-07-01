import { intentsPayload, json } from "./_demo";

export default function handler(_req: unknown, res: any) {
  json(res, intentsPayload());
}
