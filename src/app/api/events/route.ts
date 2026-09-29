// 데일리 타임라인 저장 API (POST /api/events)
import { insertEvent } from "@/db/queries";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.date || !body?.title) {
    return Response.json({ error: "date, title are required" }, { status: 400 });
  }
  await insertEvent({
    date: String(body.date),
    time: body.time ? String(body.time) : null,
    title: String(body.title),
    memo: body.memo ? String(body.memo) : null,
    kind: body.kind ? String(body.kind) : "todo",
  });
  return Response.json({ ok: true });
}
