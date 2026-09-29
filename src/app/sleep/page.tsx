// 수면 패턴 페이지
import { getPackLogs, getSleepLogs } from "@/db/queries";
import { buildDayRows, type DayRow } from "@/lib/analysis";
import { SleepBars, type SleepBarDatum } from "@/components/Charts";
import { SleepForm } from "@/components/Forms";
import { Badge, LeaderRow, Receipt, Rule, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SleepPage() {
  const [sleeps, packs] = await Promise.all([getSleepLogs(), getPackLogs()]);
  const rows = buildDayRows(sleeps, packs);
  const latest = rows[0]?.date ?? new Date().toISOString().slice(0, 10);

  const chartData: SleepBarDatum[] = [...rows]
    .reverse()
    .map((r) => ({
      dateLabel: r.dateLabel,
      sleepH: r.sleepH,
      napH: r.napH,
      outlier: r.outlier,
      score: r.score,
      conditionLabel: r.condition ?? "미기록",
    }));

  const outliers = rows.filter((r) => r.outlier != null);
  const naps = rows.filter((r) => (r.napH ?? 0) > 0);

  return (
    <div className="space-y-14">
      {/* 헤더 밴드 */}
      <section className="relative overflow-hidden border border-rule/60">
        <img
          src="/images/sleep-band.jpg"
          alt="새벽 빛이 드는 침대와 수면 일기"
          className="absolute inset-0 h-full w-full object-cover object-right"
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(242,241,236,0.95) 0%, rgba(242,241,236,0.86) 45%, rgba(246,235,200,0.18) 100%)",
          }}
        />
        <div className="relative max-w-[560px] px-6 py-14 sm:px-10">
          <p className="label text-teal">02 · SLEEP PATTERN</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.9rem,4.4vw,2.9rem)] leading-[1.18] font-bold">
            오래 잔 날보다,
            <br />
            개운했던 날을 찾습니다.
          </h1>
          <p className="mt-4 max-w-[42ch] text-[14px] leading-[1.85] text-ink-soft">
            취침·기상·낮잠·기상 컨디션을 함께 놓고 봅니다. 12시간 이상과 5시간 이하는
            이상치로 분리해서 평균이 왜곡되지 않게 처리합니다.
          </p>
        </div>
      </section>

      {/* 차트 */}
      <section>
        <SectionHeading
          index="02 · 01 / CHART"
          title="일자별 수면 리듬"
          desc="막대 = 밤 수면, 옅은 겹침 = 낮잠, 청록 점선 = 목표 수면 7시간 30분. 취침 목표는 00:00이에요."
        />
        <div className="border border-rule bg-receipt p-5 sm:p-7">
          <SleepBars data={chartData} />
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge tone="steel">밤 수면</Badge>
            <Badge tone="sand">낮잠 / 이상치</Badge>
            <Badge>목표 7h 30m · 취침 00:00</Badge>
            {outliers.length ? (
              <Badge tone="teal">이상치 {outliers.length}건</Badge>
            ) : null}
          </div>
        </div>
      </section>

      {/* 상세 명세 */}
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <SectionHeading index="02 · 02 / DETAIL" title="날짜별 수면 명세" />
          <Receipt>
            <p className="label">SLEEP LOG · 일자별 상세</p>
            <Rule />
            <div className="space-y-5">
              {rows.map((r: DayRow, i) => (
                <div key={r.date} className="rise" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-baseline">
                    <span className="tnum font-[family-name:var(--font-mono)] text-[13px] font-medium">
                      {r.dateLabel}
                    </span>
                    <span className="leader" aria-hidden="true" />
                    <span className="tnum font-[family-name:var(--font-mono)] text-[13px]">
                      {r.sleepH != null ? `${r.sleepH.toFixed(1)}h` : "-"}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5">
                    <LeaderRow label="취침" value={r.bedtime ?? "-"} />
                    <LeaderRow label="기상" value={r.wakeup ?? "-"} />
                    <LeaderRow label="낮잠" value={r.napH != null ? `${r.napH.toFixed(1)}h` : "-"} />
                    <LeaderRow label="컨디션" value={r.condition ?? "미기록"} />
                    <LeaderRow label="복용 시각" value={r.medTime ?? "-"} />
                    <LeaderRow
                      label="→ 잠들기"
                      value={r.latencyMin != null ? `${r.latencyMin}분` : "-"}
                    />
                  </div>
                  {r.outlier || r.redose ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.outlier ? <Badge tone="sand">{r.outlier}</Badge> : null}
                      {r.redose ? <Badge tone="steel">새벽 재복용</Badge> : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Receipt>
        </div>

        <div className="space-y-8">
          <div>
            <SectionHeading
              index="02 · 03 / RECORD"
              title="수면 기록 남기기"
              desc="날짜는 기상한 날 기준으로 적어 주세요."
            />
            <div className="border border-rule bg-receipt-alt p-5">
              <SleepForm defaultDate={latest} />
            </div>
          </div>

          <div>
            <SectionHeading index="02 · 04 / CHECK" title="체크 포인트" />
            <div className="space-y-3 border border-rule bg-receipt p-5">
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <strong className="text-ink">이상치 분리</strong> — 12시간 이상 {outliers.filter((r) => r.outlier === "과수면").length}건 ·
                5시간 이하 {outliers.filter((r) => r.outlier === "수면부족").length}건.
                평균 계산에서 따로 떼어 놓았어요.
              </p>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <strong className="text-ink">낮잠</strong> — 기록된 날 {naps.length}일,
                합계 {naps.reduce((s, r) => s + (r.napH ?? 0), 0).toFixed(1)}시간.
              </p>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <strong className="text-ink">주말 흔들림</strong> — 기상 시각이 주중보다 늦어지면
                그날 밤 취침이 함께 밀리는 순환이 보여요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
