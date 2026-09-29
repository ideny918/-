// 메인 — 온새미로 영수증 대시보드
import Link from "next/link";
import {
  getEvents,
  getMedications,
  getPackLogs,
  getSetting,
  getSleepLogs,
  getWaterLogs,
} from "@/db/queries";
import { buildCoachReport, buildDayRows } from "@/lib/analysis";
import { EffectCurves, type EffectDatum } from "@/components/Charts";
import { EventForm, EventToggle } from "@/components/Forms";
import {
  Barcode,
  LeaderRow,
  Receipt,
  Rule,
  SectionHeading,
  ShopFooter,
  ShopHeader,
  Stamp,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const DEFAULT_GOAL_ML = 2000;

export default async function HomePage() {
  const [sleeps, packs, events, medications, waters] = await Promise.all([
    getSleepLogs(),
    getPackLogs(),
    getEvents(),
    getMedications(),
    getWaterLogs(),
  ]);
  // 하루 수분 목표량 (사용자 설정값)
  const WATER_GOAL_ML =
    Number(await getSetting("water_goal_ml", String(DEFAULT_GOAL_ML))) || DEFAULT_GOAL_ML;

  const rows = buildDayRows(sleeps, packs);
  const report = buildCoachReport(rows);
  const today = rows[0]?.date ?? new Date().toISOString().slice(0, 10);
  const todayLabel = rows[0]?.dateLabel ?? today;
  const todaySleep = rows[0] ?? null;
  const todayEvents = events.filter((e) => e.date === today);
  const todayWater = waters.filter((w) => w.date === today);
  const waterMl = todayWater.reduce((s, w) => s + w.amountMl, 0);
  const recent = rows.slice(0, 4);
  const receiptNo = `${today.replace(/-/g, "").slice(2)}-01`;

  return (
    <div className="space-y-14">
      {/* 히어로 — 아침 책상 위 영수증 두루마리 */}
      <section className="relative -mt-2 overflow-hidden border border-rule/60">
        <img
          src="/images/hero-desk.jpg"
          alt="아침 햇살이 드는 책상 위에 놓인 영수증 두루마리와 약 포켓"
          className="absolute inset-0 h-full w-full object-cover object-left"
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(246,235,200,0.10) 0%, rgba(242,241,236,0.82) 48%, rgba(242,241,236,0.96) 100%)",
          }}
        />
        {/* 모바일에서는 글자가 사진 위에 그대로 놓이므로 별도 스크림을 덮는다 */}
        <div className="absolute inset-0 bg-receipt/75 lg:bg-transparent" />
        <div className="relative grid min-h-[420px] items-center gap-6 px-6 py-12 sm:px-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div />
          <div>
            <p className="label text-teal">온새미로 · 매일의 기록을 정리해 드리는 작은 가게</p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.1rem,5vw,3.5rem)] leading-[1.12] font-bold tracking-[-0.01em]">
              수면과 복약의 하루를,
              <br />
              <span className="text-teal">한 장의 영수증</span>으로 남기다.
            </h1>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.85] text-ink-soft">
              몇 시에 약을 먹고, 몇 시에 자고, 몇 시에 일어났을 때 개운했는지.
              평균 수면시간이 아니라 <strong className="font-semibold text-ink">패턴</strong>
              을 기록하고 읽어내는 곳입니다.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/coach" className="btn btn-primary">
                패턴 코치 리포트 보기
              </Link>
              <Link href="/water" className="btn btn-ghost">
                수분 기록 남기기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 요약 지표 스트립 */}
      <section className="grid grid-cols-2 gap-x-8 gap-y-5 border-y border-rule py-7 sm:grid-cols-4">
        {[
          { label: "기록 일수", value: `${report.stats.days}일`, note: `${report.stats.scoredDays}일 컨디션 기록` },
          { label: "평균 수면", value: `${report.stats.avgSleep}h`, note: `${report.stats.minSleep}~${report.stats.maxSleep}h` },
          { label: "평균 취침", value: report.stats.avgBedtime, note: `기상 ${report.stats.avgWakeup}` },
          { label: "오늘의 수분", value: `${waterMl}ml`, note: `목표 ${WATER_GOAL_ML}ml` },
        ].map((s, i) => (
          <div key={s.label} className="rise" style={{ animationDelay: `${i * 60}ms` }}>
            <p className="label">{s.label}</p>
            <p className="tnum mt-1.5 font-[family-name:var(--font-mono)] text-[30px] leading-none font-medium">
              {s.value}
            </p>
            <p className="mt-2 text-[11.5px] text-ink-faint">{s.note}</p>
          </div>
        ))}
      </section>

      {/* 영수증 + 사이드 */}
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div>
          <SectionHeading
            index="01 / RECEIPT"
            title={`오늘의 영수증 · ${todayLabel}`}
            desc="하루치 내역이 서점 영수증처럼 한 장에 인쇄됩니다."
          />
          <Receipt>
            <ShopHeader no={receiptNo} issued={`${today.replace(/-/g, ".")} 발행`} />

            <Rule label="오늘의 내역" />

            <div className="space-y-3">
              <div className="flex items-baseline">
                <span className="label">ITEM</span>
                <span className="leader" aria-hidden="true" />
                <span className="label">AMOUNT</span>
              </div>
              {todayEvents.length === 0 ? (
                <p className="text-[13px] text-ink-soft">
                  아직 기록된 항목이 없어요. 오른쪽에서 바로 추가해 보세요.
                </p>
              ) : (
                todayEvents.map((e, i) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 rise"
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    <EventToggle id={e.id} done={e.done === 1} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline">
                        <span className="tnum font-[family-name:var(--font-mono)] text-[12px] text-ink-faint">
                          {e.time ?? "--:--"}
                        </span>
                        <span className="leader" aria-hidden="true" />
                        <span
                          className={`text-[13.5px] font-medium ${e.done === 1 ? "text-ink-faint line-through" : "text-ink"}`}
                        >
                          {e.title}
                        </span>
                        <span className="ml-2 font-[family-name:var(--font-mono)] text-[11px] text-teal">
                          {e.done === 1 ? "완료" : "대기"}
                        </span>
                      </div>
                      {e.memo ? (
                        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">{e.memo}</p>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>

            <Rule label="수면 · 수분" />

            <div className="space-y-2.5">
              <LeaderRow label="취침" value={todaySleep?.bedtime ?? "-"} />
              <LeaderRow label="기상" value={todaySleep?.wakeup ?? "-"} />
              <LeaderRow
                label="수면"
                value={todaySleep?.sleepH != null ? `${todaySleep.sleepH.toFixed(1)}h` : "-"}
                note={todaySleep?.outlier ?? ""}
              />
              <LeaderRow label="낮잠" value={todaySleep?.napH != null ? `${todaySleep.napH.toFixed(1)}h` : "-"} />
              <LeaderRow
                label="복용 → 잠들기"
                value={todaySleep?.latencyMin != null ? `${todaySleep.latencyMin}분` : "-"}
                note={todaySleep?.medTime ? `복용 ${todaySleep.medTime}` : ""}
              />
              <LeaderRow label="수분" value={`${waterMl}ml`} note={`목표 ${WATER_GOAL_ML}ml`} />
            </div>

            <Rule label="기상 컨디션" />

            <div className="flex items-center gap-3">
              <span className="tnum font-[family-name:var(--font-mono)] text-[26px]">
                {todaySleep?.condition ?? "미기록"}
              </span>
              {todaySleep?.outlier ? (
                <span className="rounded-[2px] border border-sand px-2 py-[3px] font-[family-name:var(--font-mono)] text-[11px] text-sand">
                  {todaySleep.outlier}
                </span>
              ) : null}
            </div>

            <Rule label="합계" />

            <div className="flex items-baseline">
              <span className="text-[15px] font-semibold">TOTAL · 오늘의 기록</span>
              <span className="leader" aria-hidden="true" />
              <span className="tnum font-[family-name:var(--font-mono)] text-[19px] font-medium">
                {todayEvents.length}건 / {todaySleep?.sleepH != null ? `${todaySleep.sleepH.toFixed(1)}h` : "-"}
              </span>
            </div>

            <div className="mt-8">
              <Barcode code={receiptNo} />
            </div>

            <div className="mt-7">
              <ShopFooter />
            </div>
          </Receipt>
        </div>

        <div className="space-y-8">
          <div>
            <SectionHeading index="02 / QUICK" title="기록 추가" desc="저장 즉시 영수증에 반영됩니다." />
            <div className="border border-rule bg-receipt-alt p-5">
              <EventForm defaultDate={today} />
            </div>
          </div>

          <div>
            <SectionHeading index="03 / RECENT" title="최근 수면" />
            <ul className="space-y-2.5">
              {recent.map((r) => (
                <li key={r.date} className="flex items-baseline text-[13px]">
                  <span className="tnum font-[family-name:var(--font-mono)] text-ink-soft">
                    {r.dateLabel}
                  </span>
                  <span className="leader" aria-hidden="true" />
                  <span className="tnum font-[family-name:var(--font-mono)]">
                    {r.sleepH != null ? `${r.sleepH.toFixed(1)}h` : "-"}
                  </span>
                  <span className="ml-2 text-[11px] text-ink-faint">{r.condition ?? "미기록"}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeading
              index="04 / WATER"
              title="오늘의 수분"
              desc={`${WATER_GOAL_ML}ml 목표 대비 ${Math.round((waterMl / WATER_GOAL_ML) * 100)}%`}
            />
            <div className="border border-rule bg-receipt p-5">
              <div className="h-3 w-full border border-rule bg-receipt">
                <div
                  className="h-full bg-steel"
                  style={{ width: `${Math.min(100, (waterMl / WATER_GOAL_ML) * 100)}%` }}
                />
              </div>
              <p className="tnum mt-3 font-[family-name:var(--font-mono)] text-[13px] text-ink-soft">
                {waterMl}ml / {WATER_GOAL_ML}ml · {todayWater.length}회
              </p>
              <Link href="/water" className="btn btn-ghost mt-4">
                수분 기록 탭으로
              </Link>
            </div>
          </div>

          <div>
            <SectionHeading index="05 / CURVE" title="취침약 약효 곡선" desc="복용 후 경과 시간 기준 · 정점과 지속 구간" />
            <div className="border border-rule bg-receipt p-4">
              <EffectCurves
                meds={medications.filter((m) => m.slot === "저녁").slice(0, 6) as EffectDatum[]}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
