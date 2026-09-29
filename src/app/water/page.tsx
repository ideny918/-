// 수분 섭취 기록 탭
import Link from "next/link";
import { getSetting, getWaterLogs } from "@/db/queries";
import { GoalForm, WaterForm } from "@/components/Forms";
import { LeaderRow, Receipt, Rule, SectionHeading, ShopFooter, ShopHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const DEFAULT_GOAL_ML = 2000;

export default async function WaterPage() {
  const waters = await getWaterLogs();
  const today = waters[0]?.date ?? new Date().toISOString().slice(0, 10);
  // 하루 목표량은 사용자가 직접 설정한다 (기본 제공량 1500 / 2000 / 2500)
  const WATER_GOAL_ML =
    Number(await getSetting("water_goal_ml", String(DEFAULT_GOAL_ML))) || DEFAULT_GOAL_ML;

  const byDate = new Map<string, typeof waters>();
  for (const w of waters) {
    const list = byDate.get(w.date) ?? [];
    list.push(w);
    byDate.set(w.date, list);
  }
  const groups = [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const todayRows = waters.filter((w) => w.date === today);
  const todayMl = todayRows.reduce((s, w) => s + w.amountMl, 0);
  const pct = Math.min(100, Math.round((todayMl / WATER_GOAL_ML) * 100));
  const maxTotal = Math.max(WATER_GOAL_ML, ...groups.map(([, list]) => list.reduce((s, w) => s + w.amountMl, 0)));

  return (
    <div className="space-y-14">
      <header>
        <p className="label text-teal">05 · WATER INTAKE</p>
        <h1 className="mt-3 max-w-[20ch] font-[family-name:var(--font-display)] text-[clamp(1.9rem,4.4vw,2.9rem)] leading-[1.18] font-bold">
          물 한 잔도, <span className="text-teal">하루의 패턴</span>이 됩니다.
        </h1>
        <p className="mt-4 max-w-[58ch] text-[14px] leading-[1.85] text-ink-soft">
          오후 졸림과 아침 붓기는 수분 섭취 패턴과 함께 움직이는 경우가 있어요. 목표는 하루{" "}
          {WATER_GOAL_ML}ml, 한 번에 200~500ml씩 나눠 마시는 편이 좋아요.
        </p>
      </header>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div>
          <SectionHeading index="05 · 01 / TODAY" title={`오늘의 수분 · ${today.replace(/-/g, ".")}`} />
          <Receipt>
            <ShopHeader no={`${today.replace(/-/g, "").slice(2)}-W`} issued="수분 영수증" />
            <Rule label="오늘의 내역" />
            <div className="space-y-2">
              {todayRows.length === 0 ? (
                <p className="text-[13px] text-ink-soft">아직 기록된 물이 없어요.</p>
              ) : (
                todayRows.map((w) => (
                  <LeaderRow
                    key={w.id}
                    label={
                      <span className="tnum font-[family-name:var(--font-mono)]">
                        {w.time ?? "--:--"} {w.memo ?? "물"}
                      </span>
                    }
                    value={`${w.amountMl}ml`}
                  />
                ))
              )}
            </div>
            <Rule label="합계" />
            <div className="flex items-baseline">
              <span className="text-[15px] font-semibold">TOTAL · 오늘의 수분</span>
              <span className="leader" aria-hidden="true" />
              <span className="tnum font-[family-name:var(--font-mono)] text-[19px] font-medium">
                {todayMl}ml
              </span>
            </div>

            <div className="mt-5">
              <div className="h-3 w-full border border-rule bg-receipt">
                <div className="h-full bg-steel" style={{ width: `${pct}%` }} />
              </div>
              <p className="tnum mt-2 font-[family-name:var(--font-mono)] text-[12px] text-ink-soft">
                목표 {WATER_GOAL_ML}ml 대비 {pct}% · {todayRows.length}회
              </p>
            </div>

            <div className="mt-8">
              <ShopFooter note="물을 마신 시각과 양만 남기면 패턴 코치가 함께 읽어드립니다." />
            </div>
          </Receipt>
        </div>

        <div className="space-y-8">
          <div>
            <SectionHeading index="05 · 02 / RECORD" title="수분 기록 추가" desc="200 / 350 / 500ml 버튼 또는 직접 입력" />
            <div className="border border-rule bg-receipt-alt p-5">
              <WaterForm defaultDate={today} />
            </div>
          </div>

          <div>
            <SectionHeading
              index="05 · 03 / GOAL"
              title="하루 목표량 설정"
              desc="기본 제공량 1500 / 2000 / 2500ml 중에서 고르거나 원하는 값으로 바꿔요."
            />
            <div className="border border-rule bg-receipt-alt p-5">
              <GoalForm current={WATER_GOAL_ML} />
            </div>
          </div>

          <div>
            <SectionHeading index="05 · 04 / WEEK" title="날짜별 수분" desc="막대 길이는 목표 대비 비율" />
            <div className="border border-rule bg-receipt p-5">
              <ul className="space-y-4">
                {groups.map(([date, list]) => {
                  const total = list.reduce((s, w) => s + w.amountMl, 0);
                  return (
                    <li key={date}>
                      <div className="flex items-baseline">
                        <span className="tnum font-[family-name:var(--font-mono)] text-[12px] text-ink-soft">
                          {date.replace(/-/g, ".")}
                        </span>
                        <span className="leader" aria-hidden="true" />
                        <span className="tnum font-[family-name:var(--font-mono)] text-[12px]">
                          {total}ml · {list.length}회
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full bg-receipt">
                        <div
                          className="h-full bg-steel"
                          style={{ width: `${(total / maxTotal) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div>
            <SectionHeading index="05 · 05 / TIP" title="함께 보면 좋아요" />
            <div className="space-y-3 border border-rule bg-receipt p-5">
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <strong className="text-ink">오전</strong> — 기상 직후 350ml 한 잔이 아침 붓기와
                졸림을 가라앉히는 데 도움이 되는 편이에요.
              </p>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <strong className="text-ink">오후</strong> — 15시 이전까지 500ml를 나눠 마시면
                낮 졸림 구간이 눈에 띄게 줄어들어요.
              </p>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <strong className="text-ink">저녁</strong> — 취침 2시간 전부터는 소량씩. 잦은
                야간 각성이 수면을 자를 수 있어요.
              </p>
              <Link href="/coach" className="btn btn-ghost">
                패턴 코치 리포트 보기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
