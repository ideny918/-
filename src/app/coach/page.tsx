// 패턴 코치 — 수면·복용 기록에서 읽어낸 패턴 리포트
import Link from "next/link";
import { getPackLogs, getSleepLogs } from "@/db/queries";
import { buildCoachReport, buildDayRows } from "@/lib/analysis";
import { Badge, LeaderRow, Receipt, Rule, SectionHeading, Stamp } from "@/components/ui";

export const dynamic = "force-dynamic";

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t border-rule pt-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
      <div>
        <p className="label text-teal">{index}</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[19px] leading-snug font-semibold">
          {title}
        </h2>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((t, i) => (
        <li key={item.id} className="flex gap-3 text-[13.5px] leading-[1.9] text-ink-soft">
          <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-teal" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function CoachPage() {
  const [sleeps, packs] = await Promise.all([getSleepLogs(), getPackLogs()]);
  const report = buildCoachReport(buildDayRows(sleeps, packs));

  return (
    <div className="space-y-12">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <p className="label text-teal">04 · PATTERN COACH</p>
          <Badge tone="sand">의학적 진단이 아닙니다 · 데이터 기반 관찰</Badge>
        </div>
        <h1 className="mt-4 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(2rem,4.6vw,3.1rem)] leading-[1.15] font-bold">
          평균 수면시간이 아니라,
          <br />
          <span className="text-teal">개운했던 조합</span>을 찾습니다.
        </h1>
      </header>

      {/* 한 줄 결론 */}
      <section className="relative border-l-[3px] border-teal bg-receipt px-7 py-9 sm:px-10">
        <p className="label">ONE-LINE CONCLUSION</p>
        <p className="mt-4 max-w-[62ch] font-[family-name:var(--font-display)] text-[14px] leading-[2] font-medium">
          {report.conclusion}
        </p>
        <div className="mt-7 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-rule pt-6 sm:grid-cols-4">
          {[
            { l: "평균 수면", v: `${report.stats.avgSleep}h` },
            { l: "평균 취침", v: report.stats.avgBedtime },
            { l: "평균 기상", v: report.stats.avgWakeup },
            { l: "복용→잠들기", v: `${report.stats.avgLatency}분` },
          ].map((s) => (
            <div key={s.l}>
              <p className="label">{s.l}</p>
              <p className="tnum mt-1 font-[family-name:var(--font-mono)] text-[24px] leading-none">
                {s.v}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-10">
        <Section index="SECTION 02" title="내 수면 패턴 요약">
          <Bullets items={report.summary} />
        </Section>

        <Section index="SECTION 03" title="컨디션 좋은 날의 공통점">
          <Bullets items={report.goodPoints} />
        </Section>

        <Section index="SECTION 04" title="컨디션 나쁜 날의 공통점">
          <Bullets items={report.badPoints} />
        </Section>

        <Section index="SECTION 05" title="약 복용 시각과 컨디션의 관계">
          <Bullets items={report.medRelation} />
          <p className="mt-5 border border-rule bg-receipt-alt px-5 py-4 text-[12.5px] leading-relaxed text-ink-soft">
            아래 제안은 모두 <strong className="text-ink">복용 시각·취침 시각·기상 시각</strong>을
            옮기는 실험이에요. 약 종류·용량·복용 횟수를 바꾸자는 뜻이 아닙니다.
          </p>
        </Section>

        <Section index="SECTION 06" title="00:00 취침 · 7시간 30분 기준 추천 스케줄">
          <div className="border border-rule bg-receipt px-6 py-7">
            {report.schedule.map((s, i) => (
              <div key={s.time} className={i === 0 ? "" : "mt-4 pt-4 border-t border-dashed border-rule"}>
                <div className="flex items-baseline">
                  <span className="tnum font-[family-name:var(--font-mono)] text-[15px] font-medium text-teal">
                    {s.time}
                  </span>
                  <span className="leader" aria-hidden="true" />
                  <span className="text-[13.5px] font-medium">{s.label}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">{s.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section index="SECTION 07" title="피해야 할 패턴">
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {report.avoid.map((a) => (
              <div key={a.title} className="border-t border-rule pt-4">
                <p className="text-[13px] font-semibold text-sand">{a.title}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">{a.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section index="SECTION 08" title="7일 실험 플랜">
          <ol className="border border-rule bg-receipt">
            {report.experiment.map((e, i) => (
              <li
                key={e.day}
                className={`flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-baseline sm:gap-5 ${i > 0 ? "border-t border-dashed border-rule" : ""}`}
              >
                <span className="tnum w-[72px] shrink-0 font-[family-name:var(--font-mono)] text-[12px] tracking-[0.08em] text-teal">
                  {e.day}
                </span>
                <span className="w-[180px] shrink-0 text-[13px] font-medium">{e.title}</span>
                <span className="text-[12px] leading-relaxed text-ink-soft">{e.detail}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section index="SECTION 09" title="다음 진료 때 보여줄 요약 문장">
          <Receipt>
            <div className="flex items-start justify-between gap-4">
              <p className="label">FOR CLINIC · 수면/복약 기록 요약</p>
              <Stamp text="FOR CLINIC · 패턴 코치 ·" />
            </div>
            <Rule />
            <div className="space-y-3">
              {report.doctorSummary.map((line, i) => (
                <p key={i} className="text-[13px] leading-[2] text-ink">
                  {line}
                </p>
              ))}
            </div>
            <Rule label="기록 출처" />
            <LeaderRow label="수면 기록" value={`${report.stats.days}일`} />
            <LeaderRow label="컨디션 기록" value={`${report.stats.scoredDays}일`} />
            <LeaderRow label="수면 범위" value={`${report.stats.minSleep}~${report.stats.maxSleep}h`} />
            <p className="mt-8 text-center font-[family-name:var(--font-mono)] text-[11px] tracking-[0.16em] text-ink-faint">
              -------------- 참고 자료입니다 --------------
            </p>
          </Receipt>
        </Section>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-8">
        <Link href="/sleep" className="btn btn-primary">
          수면 기록 남기기
        </Link>
        <Link href="/meds" className="btn btn-ghost">
          복용 기록 남기기
        </Link>
        <p className="text-[11.5px] text-ink-faint">
          졸림·과수면·다음 날 멍함이 반복되면 기록을 지참해 의사와 상의해 주세요.
        </p>
      </div>
    </div>
  );
}
