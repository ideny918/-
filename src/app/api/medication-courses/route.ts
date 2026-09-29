// 기간형 복용 항목 등록·수정 API — 감기약·영양제 등
import {
  insertMedicationCourse,
  updateMedicationCourse,
  type MedicationCourseInput,
} from "@/db/queries";

function parseInput(body: Record<string, unknown>): MedicationCourseInput | null {
  const name = String(body.name ?? "").trim();
  if (!name) return null;

  const startDate = body.startDate ? String(body.startDate) : null;
  const endDate = body.endDate ? String(body.endDate) : null;
  if (startDate && endDate && endDate < startDate) return null;

  return {
    name,
    category: body.category ? String(body.category) : "기타",
    status: body.status ? String(body.status) : "active",
    startDate,
    endDate,
    schedule: body.schedule ? String(body.schedule) : null,
    frequencyPerDay: Math.max(1, Number(body.frequencyPerDay) || 1),
    unitsPerDose: Math.max(1, Number(body.unitsPerDose) || 1),
    unitLabel: body.unitLabel ? String(body.unitLabel) : "개",
    detail: body.detail ? String(body.detail) : null,
    nutrients: body.nutrients ? String(body.nutrients) : null,
    note: body.note ? String(body.note) : null,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const input = parseInput(body);
  if (!input) {
    return Response.json({ error: "입력값을 확인해 주세요." }, { status: 400 });
  }
  await insertMedicationCourse(input);
  return Response.json({ ok: true });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const id = Number(body.id);
  const input = parseInput(body);
  if (!Number.isInteger(id) || id <= 0 || !input) {
    return Response.json({ error: "id와 입력값을 확인해 주세요." }, { status: 400 });
  }
  await updateMedicationCourse(id, input);
  return Response.json({ ok: true });
}
