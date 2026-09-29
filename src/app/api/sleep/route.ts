// 수면 기록 저장 API (POST /api/sleep)
import { upsertSleepLog } from "@/db/queries";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.date) {
    return Response.json({ error: "date is required" }, { status: 400 });
  }
  await upsertSleepLog({
    date: String(body.date),
    bedtime: body.bedtime ? String(body.bedtime) : null,
    wakeup: body.wakeup ? String(body.wakeup) : null,
    sleepH: body.sleepH == null ? null : Number(body.sleepH),
    napH: body.napH == null ? null : Number(body.napH),
    morningCondition: body.morningCondition ? String(body.morningCondition) : null,
    preSleepMeds: body.preSleepMeds ? String(body.preSleepMeds) : null,
  });
  return Response.json({ ok: true });
}
