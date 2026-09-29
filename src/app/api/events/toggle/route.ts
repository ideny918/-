// 할 일 완료 토글 API (POST /api/events/toggle)
import { toggleEvent } from "@/db/queries";

export async function POST(request: Request) {
  const body = await request.json();
  if (body?.id == null) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }
  await toggleEvent(Number(body.id));
  return Response.json({ ok: true });
}
