"use client";

// 기록 입력 폼 (클라이언트) — API 라우트로 저장 후 화면 갱신
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MedicationCourse } from "@/db/schema";

function useSubmit(path: string, method: "POST" | "PUT" = "POST") {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(body: unknown) {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("저장 실패");
      setMessage("저장되었습니다");
      router.refresh();
    } catch {
      setMessage("저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return { submit, pending, message };
}

function Field({
  label,
  children,
  span = 1,
}: {
  label: string;
  children: React.ReactNode;
  span?: 1 | 2;
}) {
  return (
    <label className={`flex flex-col gap-1 ${span === 2 ? "col-span-2" : ""}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function SubmitRow({ pending, message, text }: { pending: boolean; message: string | null; text: string }) {
  return (
    <div className="col-span-2 mt-1 flex items-center gap-3">
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "저장 중…" : text}
      </button>
      {message ? <span className="text-[12px] text-ink-soft">{message}</span> : null}
    </div>
  );
}

const CONDITIONS = ["좋음", "괜찮음", "보통", "나쁨", "최악"];
const PACKS = ["아침 마음챙김 패키지 (5종)", "밤 안식 수면 패키지 (6종)"];

export function EventForm({ defaultDate }: { defaultDate: string }) {
  const { submit, pending, message } = useSubmit("/api/events");
  const [form, setForm] = useState({
    date: defaultDate,
    time: "",
    title: "",
    memo: "",
    kind: "todo",
  });
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit(form);
      }}
    >
      <Field label="날짜 / DATE">
        <input type="date" className="field" value={form.date} onChange={set("date")} required />
      </Field>
      <Field label="시각 / TIME">
        <input type="time" className="field" value={form.time} onChange={set("time")} />
      </Field>
      <Field label="제목 / TITLE" span={2}>
        <input
          type="text"
          className="field"
          placeholder="약 복용, 산책, 일기 쓰기…"
          value={form.title}
          onChange={set("title")}
          required
        />
      </Field>
      <Field label="메모 / MEMO" span={2}>
        <input type="text" className="field" placeholder="짧은 메모" value={form.memo} onChange={set("memo")} />
      </Field>
      <Field label="종류 / TYPE" span={2}>
        <select className="field" value={form.kind} onChange={set("kind")}>
          <option value="todo">할 일</option>
          <option value="event">일정</option>
          <option value="memo">메모</option>
        </select>
      </Field>
      <SubmitRow pending={pending} message={message} text="타임라인에 추가" />
    </form>
  );
}

export function SleepForm({ defaultDate }: { defaultDate: string }) {
  const { submit, pending, message } = useSubmit("/api/sleep");
  const [form, setForm] = useState({
    date: defaultDate,
    bedtime: "",
    wakeup: "",
    sleepH: "",
    napH: "",
    morningCondition: "",
    preSleepMeds: "",
  });
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit({
          date: form.date,
          bedtime: form.bedtime || null,
          wakeup: form.wakeup || null,
          sleepH: form.sleepH ? Number(form.sleepH) : null,
          napH: form.napH ? Number(form.napH) : null,
          morningCondition: form.morningCondition || null,
          preSleepMeds: form.preSleepMeds || null,
        });
      }}
    >
      <Field label="날짜 / DATE" span={2}>
        <input type="date" className="field" value={form.date} onChange={set("date")} required />
      </Field>
      <Field label="취침 / BEDTIME">
        <input type="time" className="field" value={form.bedtime} onChange={set("bedtime")} />
      </Field>
      <Field label="기상 / WAKEUP">
        <input type="time" className="field" value={form.wakeup} onChange={set("wakeup")} />
      </Field>
      <Field label="수면 시간(h)">
        <input type="number" step="0.1" min="0" max="24" className="field" placeholder="8.5" value={form.sleepH} onChange={set("sleepH")} />
      </Field>
      <Field label="낮잠(h)">
        <input type="number" step="0.1" min="0" max="12" className="field" placeholder="0.5" value={form.napH} onChange={set("napH")} />
      </Field>
      <Field label="기상 컨디션" span={2}>
        <select className="field" value={form.morningCondition} onChange={set("morningCondition")}>
          <option value="">기록 안 함</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="취침 전후 복용" span={2}>
        <input type="text" className="field" placeholder="23:20 밤 안식 수면 패키지 (6종)" value={form.preSleepMeds} onChange={set("preSleepMeds")} />
      </Field>
      <SubmitRow pending={pending} message={message} text="수면 기록 저장" />
    </form>
  );
}

/** 약 종류를 나열하지 않고, 하나의 묶음(패키지)으로 복용 여부만 체크한다 */
export function PackCheckForm({
  defaultDate,
  extraItems = [],
}: {
  defaultDate: string;
  extraItems?: string[];
}) {
  const { submit, pending, message } = useSubmit("/api/pack");
  const options = [...PACKS, ...extraItems.filter((name) => !PACKS.includes(name))];
  const [form, setForm] = useState({
    date: defaultDate,
    pack: "밤 안식 수면 패키지 (6종)",
    time: "23:20",
    taken: true,
  });
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit(form);
      }}
    >
      <Field label="날짜 / DATE">
        <input type="date" className="field" value={form.date} onChange={set("date")} required />
      </Field>
      <Field label="복용 시각 / TIME">
        <input type="time" className="field" value={form.time} onChange={set("time")} />
      </Field>
      <Field label="묶음 / PACK" span={2}>
        <select className="field" value={form.pack} onChange={set("pack")}>
          {options.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Field>
      <label className="col-span-2 flex cursor-pointer items-center gap-2.5 border border-rule bg-receipt px-3 py-2.5">
        <input
          type="checkbox"
          checked={form.taken}
          onChange={(e) => setForm((f) => ({ ...f, taken: e.target.checked }))}
          className="h-[15px] w-[15px] accent-[#2c7a72]"
        />
        <span className="text-[12.5px] text-ink">복용했어요 (해제하면 미복용으로 기록돼요)</span>
      </label>
      <SubmitRow pending={pending} message={message} text="복용 체크 저장" />
    </form>
  );
}

/** 감기약·영양제처럼 일정 기간 복용하는 항목 추가 */
export function MedicationCourseForm({ defaultDate }: { defaultDate: string }) {
  const { submit, pending, message } = useSubmit("/api/medication-courses");
  const [form, setForm] = useState({
    name: "",
    category: "감기약",
    status: "active",
    startDate: defaultDate,
    endDate: "",
    schedule: "아침",
    frequencyPerDay: 1,
    unitsPerDose: 1,
    unitLabel: "정",
    detail: "",
    note: "",
  });
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ ...form, endDate: form.endDate || null });
      }}
    >
      <Field label="이름 / NAME" span={2}>
        <input
          type="text"
          className="field"
          placeholder="예: 감기약, 오메가3"
          value={form.name}
          onChange={set("name")}
          required
        />
      </Field>
      <Field label="종류 / TYPE">
        <select className="field" value={form.category} onChange={set("category")}>
          <option value="감기약">감기약</option>
          <option value="영양제">영양제</option>
          <option value="처방약">처방약</option>
          <option value="기타">기타</option>
        </select>
      </Field>
      <Field label="상태 / STATUS">
        <select className="field" value={form.status} onChange={set("status")}>
          <option value="planned">복용 예정</option>
          <option value="active">복용 중</option>
          <option value="completed">복용 종료</option>
        </select>
      </Field>
      <Field label="시간대 / SCHEDULE">
        <select className="field" value={form.schedule} onChange={set("schedule")}>
          <option value="아침">아침</option>
          <option value="점심">점심</option>
          <option value="저녁">저녁</option>
          <option value="아침·점심·저녁">아침·점심·저녁</option>
          <option value="필요시">필요시</option>
        </select>
      </Field>
      <Field label="시작일 / START">
        <input type="date" className="field" value={form.startDate} onChange={set("startDate")} required />
      </Field>
      <Field label="종료일 / END">
        <input type="date" className="field" min={form.startDate} value={form.endDate} onChange={set("endDate")} />
      </Field>
      <Field label="하루 횟수">
        <input
          type="number"
          min="1"
          max="12"
          className="field"
          value={form.frequencyPerDay}
          onChange={(e) => setForm((f) => ({ ...f, frequencyPerDay: Number(e.target.value) }))}
        />
      </Field>
      <Field label="1회 수량">
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max="20"
            className="field"
            value={form.unitsPerDose}
            onChange={(e) => setForm((f) => ({ ...f, unitsPerDose: Number(e.target.value) }))}
          />
          <input className="field w-[76px]" value={form.unitLabel} onChange={set("unitLabel")} aria-label="단위" />
        </div>
      </Field>
      <Field label="용량·구성" span={2}>
        <input type="text" className="field" placeholder="예: 식후 1정" value={form.detail} onChange={set("detail")} />
      </Field>
      <Field label="메모" span={2}>
        <input type="text" className="field" placeholder="식후 복용 등" value={form.note} onChange={set("note")} />
      </Field>
      <SubmitRow pending={pending} message={message} text="복용 항목 추가" />
    </form>
  );
}

export function MedicationCourseEditor({ course }: { course: MedicationCourse }) {
  const { submit, pending, message } = useSubmit("/api/medication-courses", "PUT");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    id: course.id,
    name: course.name,
    category: course.category,
    status: course.status,
    startDate: course.startDate ?? "",
    endDate: course.endDate ?? "",
    schedule: course.schedule ?? "아침",
    frequencyPerDay: course.frequencyPerDay,
    unitsPerDose: course.unitsPerDose,
    unitLabel: course.unitLabel,
    detail: course.detail ?? "",
    nutrients: course.nutrients,
    note: course.note ?? "",
  });
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="mt-4 border-t border-dashed border-rule pt-3">
      <button type="button" className="btn btn-ghost" onClick={() => setOpen((v) => !v)}>
        {open ? "편집 닫기" : "수정"}
      </button>
      {open ? (
        <form
          className="mt-4 grid grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit({ ...form, startDate: form.startDate || null, endDate: form.endDate || null });
          }}
        >
          <Field label="이름" span={2}>
            <input className="field" value={form.name} onChange={set("name")} required />
          </Field>
          <Field label="종류">
            <select className="field" value={form.category} onChange={set("category")}>
              <option value="감기약">감기약</option>
              <option value="영양제">영양제</option>
              <option value="처방약">처방약</option>
              <option value="기타">기타</option>
            </select>
          </Field>
          <Field label="상태">
            <select className="field" value={form.status} onChange={set("status")}>
              <option value="planned">복용 예정</option>
              <option value="active">복용 중</option>
              <option value="completed">복용 종료</option>
            </select>
          </Field>
          <Field label="시작일">
            <input type="date" className="field" value={form.startDate} onChange={set("startDate")} />
          </Field>
          <Field label="종료일">
            <input type="date" className="field" min={form.startDate || undefined} value={form.endDate} onChange={set("endDate")} />
          </Field>
          <Field label="시간대">
            <select className="field" value={form.schedule} onChange={set("schedule")}>
              <option value="아침">아침</option>
              <option value="점심">점심</option>
              <option value="저녁">저녁</option>
              <option value="아침·점심·저녁">아침·점심·저녁</option>
              <option value="필요시">필요시</option>
            </select>
          </Field>
          <Field label="하루 횟수">
            <input type="number" min="1" max="12" className="field" value={form.frequencyPerDay} onChange={(e) => setForm((f) => ({ ...f, frequencyPerDay: Number(e.target.value) }))} />
          </Field>
          <Field label="1회 수량">
            <div className="flex gap-2">
              <input type="number" min="1" max="20" className="field" value={form.unitsPerDose} onChange={(e) => setForm((f) => ({ ...f, unitsPerDose: Number(e.target.value) }))} />
              <input className="field w-[76px]" value={form.unitLabel} onChange={set("unitLabel")} aria-label="단위" />
            </div>
          </Field>
          <Field label="용량·구성" span={2}>
            <input className="field" value={form.detail} onChange={set("detail")} />
          </Field>
          <Field label="메모" span={2}>
            <input className="field" value={form.note} onChange={set("note")} />
          </Field>
          <SubmitRow pending={pending} message={message} text="수정 내용 저장" />
        </form>
      ) : null}
    </div>
  );
}

const WATER_PRESETS = [200, 350, 500];

export function WaterForm({ defaultDate }: { defaultDate: string }) {
  const { submit, pending, message } = useSubmit("/api/water");
  const [form, setForm] = useState({
    date: defaultDate,
    time: "",
    amountMl: 350,
    memo: "",
  });

  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ ...form, amountMl: Number(form.amountMl) });
      }}
    >
      <Field label="날짜 / DATE">
        <input
          type="date"
          className="field"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          required
        />
      </Field>
      <Field label="시각 / TIME">
        <input
          type="time"
          className="field"
          value={form.time}
          onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
        />
      </Field>
      <div className="col-span-2">
        <span className="label">한 번에 마신 양</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {WATER_PRESETS.map((ml) => (
            <button
              key={ml}
              type="button"
              onClick={() => setForm((f) => ({ ...f, amountMl: ml }))}
              className={`btn ${form.amountMl === ml ? "btn-primary" : "btn-ghost"}`}
            >
              {ml}ml
            </button>
          ))}
          <input
            type="number"
            min="10"
            max="2000"
            step="10"
            className="field w-[110px]"
            value={form.amountMl}
            onChange={(e) => setForm((f) => ({ ...f, amountMl: Number(e.target.value) }))}
          />
        </div>
      </div>
      <Field label="메모 / MEMO" span={2}>
        <input
          type="text"
          className="field"
          placeholder="기상 후 물 한 컵, 오후 졸림 대비…"
          value={form.memo}
          onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
        />
      </Field>
      <SubmitRow pending={pending} message={message} text="수분 기록 추가" />
    </form>
  );
}

const GOAL_PRESETS = [1500, 2000, 2500];

/** 하루 수분 목표량 설정 — 기본 제공량(1500 / 2000 / 2500) 또는 직접 입력 */
export function GoalForm({ current }: { current: number }) {
  const { submit, pending, message } = useSubmit("/api/settings");
  const [value, setValue] = useState(current);

  return (
    <form
      className="grid grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit({ key: "water_goal_ml", value });
      }}
    >
      <div className="col-span-2">
        <span className="label">하루 목표량</span>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {GOAL_PRESETS.map((ml) => (
            <button
              key={ml}
              type="button"
              onClick={() => setValue(ml)}
              className={`btn ${value === ml ? "btn-primary" : "btn-ghost"}`}
            >
              {ml}ml
            </button>
          ))}
          <input
            type="number"
            min="200"
            max="6000"
            step="50"
            className="field w-[110px]"
            aria-label="직접 입력"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
      </div>
      <SubmitRow pending={pending} message={message} text="목표 저장" />
    </form>
  );
}

export function EventToggle({ id, done }: { id: number; done: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      aria-label={done ? "완료 취소" : "완료 처리"}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/events/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        router.refresh();
        setPending(false);
      }}
      className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[2px] border transition-colors ${
        done ? "border-teal bg-teal text-receipt" : "border-rule bg-receipt hover:border-teal"
      }`}
    >
      {done ? (
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 6.4 L4.6 9 L10 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  );
}
