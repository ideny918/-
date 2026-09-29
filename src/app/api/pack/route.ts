// 복용 체크 API (POST /api/pack) — 약을 나열하지 않고 패키지 묶음 단위로만 기록
import { insertPackLog } from "@/db/queries";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.date || !body?.pack) {
    return Response.json({ error: "date, pack are required" }, { status: 400 });
  }
  await insertPackLog({
    date: String(body.date),
    pack: String(body.pack),
    time: body.time ? String(body.time) : null,
    taken: body.taken === false || body.taken === 0 ? 0 : 1,
  });
  return Response.json({ ok: true });
}
