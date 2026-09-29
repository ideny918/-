// 수분 섭취 기록 API (POST /api/water)
import { insertWaterLog } from "@/db/queries";

export async function POST(request: Request) {
  const body = await request.json();
  const amountMl = Number(body?.amountMl);
  if (!body?.date || !Number.isFinite(amountMl) || amountMl <= 0) {
    return Response.json({ error: "date, amountMl are required" }, { status: 400 });
  }
  await insertWaterLog({
    date: String(body.date),
    time: body.time ? String(body.time) : null,
    amountMl: Math.round(amountMl),
    memo: body.memo ? String(body.memo) : null,
  });
  return Response.json({ ok: true });
}
