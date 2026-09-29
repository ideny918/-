// 앱 설정 저장 API (POST /api/settings) — 예: 하루 수분 목표량
import { setSetting } from "@/db/queries";

const ALLOWED = new Set(["water_goal_ml"]);

export async function POST(request: Request) {
  const body = await request.json();
  const key = String(body?.key ?? "");
  const value = Number(body?.value);
  if (!ALLOWED.has(key) || !Number.isFinite(value) || value <= 0) {
    return Response.json({ error: "key, value are required" }, { status: 400 });
  }
  await setSetting(key, String(Math.round(value)));
  return Response.json({ ok: true, key, value: Math.round(value) });
}
