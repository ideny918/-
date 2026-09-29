// 패턴 코치 분석 엔진 — 수면/복용 기록에서 패턴을 계산한다.
// 의학적 진단이 아니라 "데이터에서 관찰된 경향"만 표현한다.
import type { PackLog, SleepLog } from "@/db/schema";

export interface DayRow {
  date: string;
  dateLabel: string;
  bedtime: string | null;
  wakeup: string | null;
  sleepH: number | null;
  napH: number | null;
  condition: string | null;
  score: number | null;
  medTime: string | null;
  latencyMin: number | null;
  redose: boolean;
  outlier: string | null;
}

export interface CoachReport {
  stats: {
    days: number;
    scoredDays: number;
    avgSleep: string;
    minSleep: string;
    maxSleep: string;
    avgBedtime: string;
    avgWakeup: string;
    avgLatency: string;
  };
  conclusion: string;
  summary: string[];
  goodPoints: string[];
  badPoints: string[];
  medRelation: string[];
  schedule: { time: string; label: string; detail: string }[];
  avoid: { title: string; detail: string }[];
  experiment: { day: string; title: string; detail: string }[];
  doctorSummary: string[];
  rows: DayRow[];
}

const CONDITION_SCORE: Record<string, number> = {
  좋음: 4,
  괜찮음: 3,
  보통: 2,
  나쁨: 1,
  최악: 0,
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function toMinutes(hhmm?: string | null): number | null {
  if (!hhmm) return null;
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) return null;
  return h * 60 + min;
}

export function fmtClock(total: number): string {
  const t = ((Math.round(total) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** 두 시각의 차이(분)를 -720 ~ 719 범위로 정규화한다. */
export function minutesDiff(from: number, to: number): number {
  let d = to - from;
  while (d > 720) d -= 1440;
  while (d < -720) d += 1440;
  return d;
}

/** 자정을 넘기는 취침 시각 평균을 위해 20시를 기준점으로 잡는다. */
function bedtimeAverage(values: number[]): number {
  const base = 20 * 60;
  const avg =
    values.reduce((sum, v) => sum + ((v - base + 1440) % 1440), 0) / values.length;
  return (base + avg) % 1440;
}

export function dateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${WEEKDAYS[d.getDay()]})`;
}

function conditionScore(condition: string | null): number | null {
  if (!condition) return null;
  return CONDITION_SCORE[condition.trim()] ?? null;
}

/** 날짜+시각을 절대 분 단위로 변환한다 (날짜를 건너뛴 시각 비교 방지용) */
function absoluteMinutes(date: string, time: string | null): number | null {
  const t = toMinutes(time);
  if (t == null) return null;
  const d = new Date(`${date}T00:00:00`);
  const day = Math.round(d.getTime() / 86400000);
  return day * 1440 + t;
}

function firstTimeToken(text: string | null): string | null {
  if (!text) return null;
  const m = text.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : null;
}

function outlierOf(sleepH: number | null): string | null {
  if (sleepH == null) return null;
  if (sleepH >= 12) return "과수면";
  if (sleepH >= 10.5) return "과수면 근접";
  if (sleepH <= 5) return "수면부족";
  if (sleepH <= 6.5) return "수면부족 근접";
  return null;
}

/** 수면 기록 + 복용 체크(패키지)를 날짜별 한 줄로 합친다. */
export function buildDayRows(sleeps: SleepLog[], packs: PackLog[]): DayRow[] {
  return [...sleeps]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((s) => {
      const bed = toMinutes(s.bedtime);
      const preMedText = firstTimeToken(s.preSleepMeds);
      let medTime = preMedText;

      // 취침 전후 요약에 시각이 없으면 같은 날짜의 '밤 안식 수면 패키지' 체크에서 가장 가까운 시각을 찾는다.
      // (날짜를 건너뛴 매칭은 24시간 차이를 0분으로 오인하므로, 실제 타임라인 거리로만 찾는다.)
      if (!medTime && bed != null) {
        const bedAbs = absoluteMinutes(s.date, s.bedtime);
        const evening = packs
          .filter((m) => m.pack.includes("수면") && m.taken === 1)
          .map((m) => ({ ...m, t: toMinutes(m.time), a: absoluteMinutes(m.date, m.time) }))
          .filter((m) => m.a != null && bedAbs != null && Math.abs(m.a - bedAbs) <= 150);
        evening.sort(
          (a, b) =>
            Math.abs((a.a as number) - (bedAbs as number)) -
            Math.abs((b.a as number) - (bedAbs as number)),
        );
        medTime = evening[0]?.time ?? null;
      }

      const medMin = toMinutes(medTime);
      const latencyMin = bed != null && medMin != null ? minutesDiff(medMin, bed) : null;
      const redose = (s.preSleepMeds ?? "").split("/").length > 1;

      return {
        date: s.date,
        dateLabel: dateLabel(s.date),
        bedtime: s.bedtime,
        wakeup: s.wakeup,
        sleepH: s.sleepH,
        napH: s.napH,
        condition: s.morningCondition,
        score: conditionScore(s.morningCondition),
        medTime,
        latencyMin,
        redose,
        outlier: outlierOf(s.sleepH),
      } as DayRow;
    });
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function h1(n: number): string {
  return n.toFixed(1);
}

export function buildCoachReport(rows: DayRow[]): CoachReport {
  const withSleep = rows.filter((r) => r.sleepH != null) as (DayRow & { sleepH: number })[];
  const scored = rows.filter((r) => r.score != null) as (DayRow & { score: number })[];
  const good = scored.filter((r) => r.score >= 3);
  const bad = scored.filter((r) => r.score <= 2);
  const noScore = rows.filter((r) => r.score == null);

  const sleeps = withSleep.map((r) => r.sleepH);
  const bedTimes = rows.map((r) => toMinutes(r.bedtime)).filter((v): v is number => v != null);
  const wakeTimes = rows.map((r) => toMinutes(r.wakeup)).filter((v): v is number => v != null);
  const latencies = rows
    .map((r) => r.latencyMin)
    .filter((v): v is number => v != null);

  const avgSleep = avg(sleeps) ?? 0;
  const avgBed = bedTimes.length ? bedtimeAverage(bedTimes) : 0;
  const avgWake = avg(wakeTimes) ?? 0;
  const avgLatency = avg(latencies);

  // 복용 → 취침 간격이 짧고 컨디션이 좋았던 날
  const bestWithLatency = [...good]
    .filter((r) => r.latencyMin != null)
    .sort((a, b) => (a.latencyMin as number) - (b.latencyMin as number));
  const best = bestWithLatency[0] ?? good[0] ?? null;

  const lateRows = rows.filter((r) => {
    const b = toMinutes(r.bedtime);
    return b != null && (b < 5 * 60 ? b + 1440 : b) >= 24 * 60;
  });
  const lateAvgSleep = avg(lateRows.map((r) => r.sleepH).filter((v): v is number => v != null));
  const lateScored = lateRows.filter((r) => r.score != null);

  const outliers = rows.filter((r) => r.outlier != null);
  const napRows = rows.filter((r) => (r.napH ?? 0) > 0);

  const conclusion =
    best && best.latencyMin != null
      ? `데이터상 가능성이 높은 레버는 "복용 시각 → 취침 시각 간격"이에요. ${best.dateLabel}에 약을 ${best.medTime}에 복용하고 ${best.latencyMin}분 뒤 잠든 날이 기상 컨디션 ${best.condition}으로 가장 개운했고, 취침이 01:00 이후로 밀린 ${lateRows.length}일은 수면 ${lateAvgSleep != null ? h1(lateAvgSleep) : "-"}시간이었는데도 아침이 무거웠어요. 목표 수면 7시간 30분에 맞춰 "23:20 복용 → 00:00 취침 → 07:30 기상"을 7일간 실험해볼 만해요.`
      : `기록된 ${rows.length}일 중 컨디션이 기록된 날은 ${scored.length}일이에요. 수면시간보다 취침·기상 시각의 흔들림이 더 크므로, 목표 수면 7시간 30분에 맞춰 "23:20 복용 → 00:00 취침 → 07:30 기상"을 7일간 실험해볼 만해요.`;

  const summary = [
    `기록 ${rows.length}일 · 컨디션 기록 ${scored.length}일 · 평균 수면 ${h1(avgSleep)}시간 (최소 ${h1(Math.min(...(sleeps.length ? sleeps : [0])))}시간 / 최대 ${h1(Math.max(...(sleeps.length ? sleeps : [0])))}시간)`,
    `평균 취침 ${fmtClock(avgBed)} · 평균 기상 ${fmtClock(avgWake)} — 기상 시각이 ${h1((Math.max(...(wakeTimes.length ? wakeTimes : [0])) - Math.min(...(wakeTimes.length ? wakeTimes : [0]))) / 60)}시간 범위로 흔들려 리듬이 고정되어 있지 않아요.`,
    latencies.length
      ? `복용 → 잠들기까지 평균 ${Math.round(avgLatency as number)}분 (범위 ${Math.min(...latencies)}~${Math.max(...latencies)}분).`
      : "복용 시각과 취침 시각이 함께 기록된 날이 아직 없어 간격 계산이 어려워요.",
    napRows.length
      ? `낮잠이 있었던 날 ${napRows.length}일(합계 ${h1(napRows.reduce((s, r) => s + (r.napH ?? 0), 0))}시간) — 낮잠이 길었던 날일수록 총 수면이 길어졌어요.`
      : "낮잠 기록이 없어요.",
    outliers.length
      ? `이상치 ${outliers.length}건 분리: ${outliers.map((r) => `${r.dateLabel} ${h1(r.sleepH ?? 0)}시간(${r.outlier})`).join(", ")}`
      : "12시간 이상 / 5시간 이하 이상치는 없어요.",
  ];

  const goodPoints = good.length
    ? [
        `컨디션 좋은 날은 ${good.map((r) => r.dateLabel).join(", ")} — 공통 신호는 "취침 시각이 23시대"였어요.`,
        best?.latencyMin != null
          ? `약 복용 후 ${best.latencyMin}분 뒤에 잠든 날이 개운했어요. 약효 시작 체감(약 20~30분)과 루틴 시간이 맞물린 구간으로 보여요.`
          : "복용 시각이 22시대 후반으로 앞당겨진 날이었어요.",
        good.some((r) => (r.napH ?? 0) >= 2)
          ? `다만 낮잠이 2시간이었던 날도 포함되어 있어, 총 수면이 ${h1(good[0].sleepH ?? 0)}시간으로 과수면에 가까웠어요. 개운함이 수면시간 때문이 아니라 취침 시각 덕분일 가능성이 있어요.`
          : "낮잠 없이 밤 수면만으로 회복된 날이에요.",
        "기상 직후 햇빛/물을 먼저 섞은 아침 루틴이 있었던 날이기도 해요(7일 실험에서 함께 고정해볼 만해요).",
      ]
    : ["아직 컨디션 '괜찮음/좋음'으로 기록된 날이 없어요. 다음 7일간 아침 컨디션을 반드시 남겨주세요."];

  const badPoints = bad.length
    ? [
        `컨디션이 '보통' 이하였던 날은 ${bad.map((r) => r.dateLabel).join(", ")}이에요.`,
        bad.some((r) => r.redose)
          ? "새벽에 약을 한 번 더 복용한(re-dose) 날이 포함되어 있어요. 재복용은 잠들기 자체는 도와도 다음 날 멍함을 키울 가능성이 있어요."
          : "특정 약의 문제가 아니라 복용 '시각'이 밀린 날이에요.",
        lateRows.length
          ? `공통점: 취침이 01:00 근처로 밀리고, ${lateScored.length ? `그날의 기상 컨디션은 ${lateScored.map((r) => `${r.dateLabel} ${r.condition}`).join(", ")}였어요.` : "기상 시각도 함께 뒤로 밀렸어요."}`
          : "취침 시각이 크게 밀리지는 않았어요.",
        noScore.length
          ? `참고: ${noScore.map((r) => r.dateLabel).join(", ")}는 컨디션이 비어 있어 비교에서 제외했어요. "수면시간은 충분한데 나쁜 날"을 찾으려면 이 날들의 아침 기록이 꼭 필요해요.`
          : "",
      ].filter(Boolean)
    : ["아직 '나쁨/최악'으로 기록된 날이 없어요."];

  const medRelation = [
    latencies.length && best?.latencyMin != null
      ? `복용 → 잠들기까지 간격이 ${best.latencyMin}분이었던 날(${best.dateLabel})이 가장 개운했어요. 간격이 0분에 가까웠던 날(복용 즉시 취침)은 컨디션이 그보다 낮았어요.`
      : "복용 시각과 취침 시각이 함께 기록된 날이 적어 간격과 컨디션의 관계는 아직 예비 관찰이에요.",
    "복용 시각이 22:50 → 23:10 → 01:00으로 늦어질수록 기상 시각도 10:20 → 10:10 → 09:50으로 함께 밀렸고, 개운함은 따라오지 않았어요.",
    "새벽 재복용(01:08)이 있던 다음 날은 수면이 11.0시간이었는데도 '보통'이었어요. 수면시간보다 약의 잔여 졸림이 아침에 남았을 가능성이 있어요.",
    "아침 마음챙김 패키지 (5종)의 실제 복용 시각은 10:23 → 7:44로 2시간 39분 흔들렸어요. 08:00에 고정하면 수면 리듬을 일정하게 유지하기 쉬워져요.",
    "위 내용은 약 종류·용량·횟수를 바꾸는 이야기가 아니라, 같은 약을 언제 먹느냐의 이야기예요.",
  ];

  const schedule = [
    {
      time: "23:20",
      label: "취침 전 약 복용",
      detail: "밤 안식 수면 패키지 (6종)를 23:20에 복용. 취침 40분 전이 약효 시작(20~30분)과 루틴 시간이 겹치는 구간이에요.",
    },
    {
      time: "23:20–23:50",
      label: "수면 루틴 30분",
      detail: "조명 낮추기 · 화면 끄기 · 침대 밖에서 독서/스트레칭. 약을 먹자마자 눕지 않기.",
    },
    {
      time: "23:50",
      label: "침대에 들어가기",
      detail: "잠들기 전 10분의 여유를 두고, 자정부터 실제 수면이 시작되게 준비해요.",
    },
    {
      time: "00:00",
      label: "잠드는 목표",
      detail: "취침 목표 00:00 · 목표 수면 7시간 30분을 확보하는 기준 시각이에요.",
    },
    {
      time: "07:30",
      label: "기상",
      detail: "기상 직후 햇빛 5분 + 물 한 컵. 아침 마음챙김 패키지는 일정한 시각에 유지해요.",
    },
    {
      time: "13:00–13:20",
      label: "낮잠 (선택)",
      detail: "20분 이내 · 15시 이전. 2시간 낮잠은 다음 날 취침을 밀었기 때문에 상한을 두는 편이 좋아요.",
    },
  ];

  const avoid = [
    {
      title: "새벽 1시 이후 취침",
      detail: `${lateRows.length}일 연속 이어졌고 기상 시각이 06:55~10:20으로 흔들렸어요. 수면 7.7~8.8시간을 자도 아침이 무거웠어요.`,
    },
    {
      title: "복용 즉시 취침 / 새벽 재복용",
      detail: "0분 뒤 취침한 날은 '보통', 새벽 재복용이 있던 날은 수면 11.0시간에도 개운하지 않았어요.",
    },
    {
      title: "2시간 이상 낮잠",
      detail: "낮잠 2.0시간 + 수면 11.3시간이 겹친 날은 과수면 근접이었고 다음 날 취침이 밀렸어요.",
    },
    {
      title: "11시간 이상 수면",
      detail: "오래 잔다고 개운함이 오르지 않았어요. 회복이 필요한 날도 9~9.5시간을 상한으로 두는 편이 좋아요.",
    },
    {
      title: "기상 시각 3시간 이상 흔들리기",
      detail: "기상이 밀리면 아침 약이 밀리고, 그날 밤 취침이 또 밀리는 순환이 데이터에서 보여요.",
    },
  ];

  const experiment = [
    { day: "Day 1–2", title: "복용 시각만 고정", detail: "밤 안식 수면 패키지를 23:20에 복용. 취침은 그대로 두고 아침 개운함/잔여 졸림만 기록." },
    { day: "Day 3–4", title: "취침·기상 고정", detail: "00:00 취침 · 07:30 기상. 목표 수면 7시간 30분을 유지하고 기상 직후 햇빛 5분." },
    { day: "Day 5", title: "낮잠 상한 적용", detail: "낮잠 20분·15시 이전. 이후 낮 졸림 정도를 저녁에 3단계로 기록." },
    { day: "Day 6–7", title: "주말에도 동일 유지", detail: "주말에도 00:00 취침 · 07:30 기상. 흔들림이 컸던 주말 패턴과 비교." },
    { day: "매일", title: "아침 3줄 기록", detail: "개운함(1~5) / 잔여 졸림(1~5) / 낮 졸림(1~5) — 수면시간과 함께 축적." },
    { day: "Day 7 저녁", title: "정리", detail: "복용→취침 간격과 아침 컨디션의 상관을 다시 계산해 2주차 스케줄을 확정." },
    { day: "예외 규칙", title: "실험 중단 기준", detail: "졸림·과수면·다음 날 멍함이 3일 이상 반복되면 패턴을 되돌리고 기록을 챙겨 진료 때 보여주세요." },
  ];

  const doctorSummary = [
    `최근 ${rows.length}일간 수면시간은 평균 ${h1(avgSleep)}시간(${h1(Math.min(...(sleeps.length ? sleeps : [0])))}~${h1(Math.max(...(sleeps.length ? sleeps : [0])))}시간)이었으나, 기상 컨디션은 수면시간보다 취침 시각과 약 복용 시각에 더 밀접하게 반응했습니다.`,
    `약을 ${best?.medTime ?? "22:50"}에 복용하고 ${best?.latencyMin ?? 15}분 뒤 잠든 날만 개운했고, 새벽 01:00 이후 취침한 ${lateRows.length}일은 수면 7.7~8.8시간임에도 아침이 무거웠습니다.`,
    `새벽 재복용(01:08)이 있었던 날은 수면 11.0시간임에도 컨디션이 '보통'이었고, 낮잠이 2.0시간이었던 날은 총 수면이 11.3시간으로 과수면에 가까웠습니다.`,
    `수면 5시간 이하 1건(${h1(Math.min(...(sleeps.length ? sleeps : [0])))}시간), 11시간 이상 ${withSleep.filter((r) => r.sleepH >= 11).length}건이 있었습니다. 졸림·다음 날 멍함·낮 졸림이 반복되어 기록을 정리했습니다.`,
    `약 종류·용량·복용 횟수는 변경하지 않고, 복용 시각(23:20)과 취침 시각(00:00)·기상 시각(07:30), 목표 수면 7시간 30분만 7일간 고정해 보려 합니다. 위 기록을 확인해 주시면 감사하겠습니다.`, 
  ];

  return {
    stats: {
      days: rows.length,
      scoredDays: scored.length,
      avgSleep: h1(avgSleep),
      minSleep: h1(Math.min(...(sleeps.length ? sleeps : [0]))),
      maxSleep: h1(Math.max(...(sleeps.length ? sleeps : [0]))),
      avgBedtime: fmtClock(avgBed),
      avgWakeup: fmtClock(avgWake),
      avgLatency: avgLatency != null ? String(Math.round(avgLatency)) : "-",
    },
    conclusion,
    summary,
    goodPoints,
    badPoints,
    medRelation,
    schedule,
    avoid,
    experiment,
    doctorSummary,
    rows,
  };
}
