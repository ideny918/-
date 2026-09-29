// 복약 트래커 페이지 — 약효 곡선과 패키지 단위 복용 체크
import {
  getMedicationCourses,
  getMedications,
  getPackLogs,
  getSleepLogs,
} from "@/db/queries";
import { buildDayRows } from "@/lib/analysis";
import { EffectCurves, type EffectDatum } from "@/components/Charts";
import {
  MedicationCourseEditor,
  MedicationCourseForm,
  PackCheckForm,
} from "@/components/Forms";
import { Badge, LeaderRow, Receipt, Rule, SectionHeading, Stamp } from "@/components/ui";

export const dynamic = "force-dynamic";

const PACKS = ["아침 마음챙김 패키지 (5종)", "밤 안식 수면 패키지 (6종)"];

type Nutrient = {
  name: string;
  amount: string;
  percent?: number;
  serving?: string;
};

function readNutrients(value: string | null): Nutrient[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as Nutrient[]) : [];
  } catch {
    return [];
  }
}

export default async function MedsPage() {
  const [medications, courses, packs, sleeps] = await Promise.all([
    getMedications(),
    getMedicationCourses(),
    getPackLogs(),
    getSleepLogs(),
  ]);
  const rows = buildDayRows(sleeps, packs);
  const today = rows[0]?.date ?? new Date().toISOString().slice(0, 10);
  const evening = medications.filter((m) => m.slot === "저녁");
  const activeCourses = courses.filter(
    (course) =>
      course.status === "active" &&
      (!course.startDate || course.startDate <= today) &&
      (!course.endDate || course.endDate >= today),
  );
  const checkItems = [...PACKS, ...activeCourses.map((course) => course.name)];

  // 오늘의 복용 체크 — 기본 패키지와 현재 복용 중인 기간형 항목 표시
  const todayPacks = packs.filter((p) => p.date === today);

  return (
    <div className="space-y-14">
      <header>
        <p className="label text-teal">03 · MEDICATION TRACKING</p>
        <h1 className="mt-3 max-w-[22ch] font-[family-name:var(--font-display)] text-[clamp(1.9rem,4.4vw,2.9rem)] leading-[1.18] font-bold">
          약이 아니라, <span className="text-teal">약을 먹는 시간</span>을 관리합니다.
        </h1>
        <p className="mt-4 max-w-[58ch] text-[14px] leading-[1.85] text-ink-soft">
          매일 반복되는 약은 <strong className="text-ink">마음챙김·수면 패키지</strong>로 간단히 체크하고,
          감기약이나 영양제는 시작일·종료일이 있는 항목으로 추가할 수 있어요. 복용 시각은 같은
          체크 목록에 남기고, 개별 약 정보와 지속 시간은 아래 트래커와 약효 곡선에서 확인합니다.
        </p>
      </header>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <SectionHeading index="03 · 01 / CHECK" title="복용 체크" desc="묶음 단위 · 복용 여부와 시각만" />
          <Receipt>
            <p className="label">PACK CHECK · {today.replace(/-/g, ".")}</p>
            <Rule />
            <div className="space-y-3">
              {checkItems.map((pack) => {
                const log = todayPacks.find((p) => p.pack === pack);
                return (
                  <div key={pack} className="flex items-baseline">
                    <span
                      className={`grid h-[18px] w-[18px] place-items-center rounded-[2px] border ${
                        log?.taken === 1 ? "border-teal bg-teal text-receipt" : "border-rule bg-receipt"
                      }`}
                    >
                      {log?.taken === 1 ? (
                        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
                          <path
                            d="M2 6.4 L4.6 9 L10 3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </span>
                    <span className="ml-3 text-[13.5px] font-medium">{pack}</span>
                    <span className="leader" aria-hidden="true" />
                    <span className="tnum font-[family-name:var(--font-mono)] text-[13px]">
                      {log ? (log.time ?? "시각 미기록") : "미기록"}
                    </span>
                    <span className="ml-2 text-[11px] text-ink-faint">
                      {log?.taken === 1 ? "복용" : log ? "미복용" : "-"}
                    </span>
                  </div>
                );
              })}
            </div>

            <Rule label="오늘의 체크 내역" />

            {todayPacks.length === 0 ? (
              <p className="text-[13px] text-ink-soft">오늘은 아직 체크된 패키지가 없어요.</p>
            ) : (
              <div className="space-y-2">
                {todayPacks.map((p) => (
                  <LeaderRow
                    key={p.id}
                    label={<span className="tnum font-[family-name:var(--font-mono)]">{p.time ?? "--:--"} · {p.pack}</span>}
                    value={p.taken === 1 ? "복용" : "미복용"}
                  />
                ))}
              </div>
            )}

            <div className="mt-9 flex items-center justify-between">
              <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] text-ink-faint">
                -------------- 약 구성은 트래커 탭에서 확인 --------------
              </p>
              <Stamp />
            </div>
          </Receipt>
        </div>

        <div className="space-y-8">
          <div>
            <SectionHeading
              index="03 · 02 / RECORD"
              title="복용 체크 남기기"
              desc="약 이름을 적지 않아도 됩니다. 묶음과 시각만 남기면 패턴 분석에 반영돼요."
            />
            <div className="border border-rule bg-receipt-alt p-5">
              <PackCheckForm
                defaultDate={today}
                extraItems={activeCourses.map((course) => course.name)}
              />
            </div>
          </div>

          <div>
            <SectionHeading index="03 · 03 / CURVE" title="약효 곡선" desc="복용 후 경과 시간 기준 · 정점과 지속 구간" />
            <div className="border border-rule bg-receipt p-5">
              <EffectCurves meds={evening.slice(0, 6) as EffectDatum[]} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="teal">정점(peak)</Badge>
                <Badge>곡선 = 체감 약효</Badge>
                <Badge tone="sand">지속 이후 = 잔여 졸림 구간</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div>
          <SectionHeading
            index="03 · 04 / COURSE"
            title="기간형 복용 항목"
            desc="감기약·영양제처럼 시작일과 종료일을 정해 관리합니다. 종료일을 비우면 현재 복용 중으로 표시돼요."
          />
          <Receipt>
            <p className="label">ACTIVE &amp; SCHEDULED · {courses.length} ITEMS</p>
            <Rule />
            <div className="space-y-6">
              {courses.map((course) => {
                const nutrients = readNutrients(course.nutrients);
                const active =
                  course.status === "active" &&
                  (!course.startDate || course.startDate <= today) &&
                  (!course.endDate || course.endDate >= today);
                const statusLabel =
                  course.status === "planned" ? "복용 예정" : active ? "복용 중" : "복용 종료";
                return (
                  <article key={course.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-[family-name:var(--font-display)] text-[17px] font-semibold">
                        {course.name}
                      </h3>
                      <Badge tone={active ? "teal" : course.status === "planned" ? "sand" : "neutral"}>
                        {statusLabel}
                      </Badge>
                      <Badge tone="sage">{course.category}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <LeaderRow label="기간" value={`${course.startDate ?? "시작일 미정"} ~ ${course.endDate ?? "계속"}`} />
                      <LeaderRow label="시간대" value={course.schedule ?? "미지정"} />
                      <LeaderRow
                        label="섭취"
                        value={`1회 ${course.unitsPerDose}${course.unitLabel} × 하루 ${course.frequencyPerDay}회 (총 ${course.unitsPerDose * course.frequencyPerDay}${course.unitLabel})`}
                      />
                      <LeaderRow label="구성" value={course.detail ?? "미기록"} />
                    </div>
                    {nutrients.length > 0 ? (
                      <div className="mt-4 border-t border-dashed border-rule pt-4">
                        <p className="label">주요 성분</p>
                        <div className="mt-3 space-y-3">
                          {nutrients.map((nutrient) => (
                            <div key={nutrient.name}>
                              <div className="flex items-baseline text-[12px] text-ink-soft">
                                <span>{nutrient.name} ({nutrient.amount})</span>
                                <span className="leader" aria-hidden="true" />
                                <span className="tnum font-[family-name:var(--font-mono)]">
                                  {nutrient.percent != null ? `${nutrient.percent}%` : "함량 표기"}
                                </span>
                              </div>
                              {nutrient.percent != null ? (
                                <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-paper-deep">
                                  <div
                                    className="h-full rounded-full bg-teal"
                                    style={{ width: `${Math.min(100, nutrient.percent)}%` }}
                                  />
                                </div>
                              ) : null}
                              {nutrient.serving ? (
                                <p className="mt-1 text-[10.5px] text-ink-faint">{nutrient.serving}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-right text-[10.5px] text-ink-faint">
                          % · 1일 영양성분 기준치에 대한 비율
                        </p>
                      </div>
                    ) : null}
                    {course.note ? <p className="mt-3 text-[11.5px] leading-relaxed text-ink-soft">{course.note}</p> : null}
                    <MedicationCourseEditor course={course} />
                  </article>
                );
              })}
            </div>
          </Receipt>
        </div>

        <div>
          <SectionHeading
            index="03 · 05 / ADD"
            title="기간형 항목 추가"
            desc="감기약이나 새 영양제를 등록하면 복용 체크 선택지에도 자동으로 추가됩니다."
          />
          <div className="border border-rule bg-receipt-alt p-5">
            <MedicationCourseForm defaultDate={today} />
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          index="03 · 06 / TRACKER"
          title="복약 트래커"
          desc="패키지에 들어가는 약 정보와 약효 시작·정점·지속 시간입니다."
        />
        <Receipt>
          <p className="label">PRESCRIPTION · {medications.length} ITEMS</p>
          <Rule />
          <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {medications.map((m, i) => (
              <div key={m.id} className="rise" style={{ animationDelay: `${i * 45}ms` }}>
                <div className="flex items-baseline">
                  <span className="text-[13.5px] font-medium">{m.name}</span>
                  <span className="leader" aria-hidden="true" />
                  <span className="tnum font-[family-name:var(--font-mono)] text-[13px]">{m.dose}</span>
                  <span className="ml-2 font-[family-name:var(--font-mono)] text-[11px] text-ink-faint">
                    {m.slot}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-x-4">
                  <LeaderRow label="시작" value={m.onsetMin != null ? `${m.onsetMin}분` : "-"} />
                  <LeaderRow label="정점" value={m.peakMin != null ? `${m.peakMin}분` : "-"} />
                  <LeaderRow label="지속" value={m.durationH != null ? `${m.durationH}h` : "-"} />
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">{m.note}</p>
                <p className="mt-1 text-[11px] text-ink-faint">
                  다음 날 잔여 졸림 · {m.nextDayDrowsiness ?? "미기록"}
                </p>
              </div>
            ))}
          </div>
        </Receipt>
      </section>
    </div>
  );
}
