// 앱 최초 실행 시 삽입되는 시드 데이터 (사용자가 제공한 CSV 원본을 정리한 것)
import { db } from "@/db";
import {
  appSettings,
  dailyEvents,
  medicationCourses,
  medications,
  packLogs,
  sleepLogs,
  waterLogs,
} from "@/db/schema";

const SLEEP_SEED = [
  {
    date: "2026-09-23",
    bedtime: null,
    wakeup: null,
    sleepH: null,
    napH: null,
    morningCondition: "보통",
    preSleepMeds: null,
  },
  {
    date: "2026-09-25",
    bedtime: "23:05",
    wakeup: "10:20",
    sleepH: 11.3,
    napH: 2.0,
    morningCondition: "괜찮음",
    preSleepMeds: "22:50 밤 안식 수면 패키지 (6종)",
  },
  {
    date: "2026-09-26",
    bedtime: "23:10",
    wakeup: "10:10",
    sleepH: 11.0,
    napH: null,
    morningCondition: "보통",
    preSleepMeds: "23:10 밤 안식 수면 패키지 (6종) / 1:08 밤 안식 수면 패키지 (6종)(재복용)",
  },
  {
    date: "2026-09-27",
    bedtime: "1:05",
    wakeup: "9:50",
    sleepH: 8.8,
    napH: null,
    morningCondition: null,
    preSleepMeds: "1:00 밤 안식 수면 패키지 (6종)",
  },
  {
    date: "2026-09-28",
    bedtime: "1:00",
    wakeup: "8:40",
    sleepH: 7.7,
    napH: 1.0,
    morningCondition: null,
    preSleepMeds: null,
  },
  {
    date: "2026-09-29",
    bedtime: "0:30",
    wakeup: "6:55",
    sleepH: 6.4,
    napH: null,
    morningCondition: null,
    preSleepMeds: null,
  },
];

// 약 종류를 나열하지 않고 '패키지' 묶음으로만 기록한다
type PackSeedRow = [string, string, string, number];

const PACK_SEED: PackSeedRow[] = [
  ["2026-09-24", "22:50", "밤 안식 수면 패키지 (6종)", 1],
  ["2026-09-25", "10:23", "아침 마음챙김 패키지 (5종)", 1],
  ["2026-09-25", "23:10", "밤 안식 수면 패키지 (6종)", 1],
  ["2026-09-26", "1:08", "밤 안식 수면 패키지 (6종)", 1],
  ["2026-09-26", "10:16", "아침 마음챙김 패키지 (5종)", 1],
  ["2026-09-27", "1:00", "밤 안식 수면 패키지 (6종)", 1],
  ["2026-09-27", "9:59", "아침 마음챙김 패키지 (5종)", 1],
  ["2026-09-28", "8:45", "아침 마음챙김 패키지 (5종)", 1],
  ["2026-09-29", "7:44", "아침 마음챙김 패키지 (5종)", 1],
];

type WaterSeedRow = [string, string, number, string | null];

const WATER_SEED: WaterSeedRow[] = [
  ["2026-09-27", "09:10", 350, "기상 후 물 한 컵"],
  ["2026-09-27", "13:20", 500, null],
  ["2026-09-27", "16:40", 350, "오후 졸림 대비"],
  ["2026-09-27", "21:00", 200, null],
  ["2026-09-28", "08:50", 500, "아침 식사와 함께"],
  ["2026-09-28", "12:30", 350, null],
  ["2026-09-28", "15:10", 500, null],
  ["2026-09-28", "19:40", 200, null],
  ["2026-09-28", "22:10", 350, "취침 1시간 전"],
  ["2026-09-29", "08:05", 350, "기상 후 물 한 컵"],
  ["2026-09-29", "11:30", 500, null],
  ["2026-09-29", "14:20", 350, "낮 졸림 대비"],
];

// 취침약 6종은 약효 곡선용 파라미터, 아침약 2종은 기본 정보만
const COURSE_SEED = [
  {
    name: "비타민 구미",
    category: "영양제",
    status: "active",
    startDate: "2026-08-13",
    endDate: null,
    schedule: "아침·점심·저녁",
    frequencyPerDay: 3,
    unitsPerDose: 1,
    unitLabel: "개",
    detail: "1회 1개 · 하루 총 3회 3개",
    nutrients: JSON.stringify([
      { name: "비타민 C", amount: "252mg", percent: 252 },
      { name: "비타민 D", amount: "9μg", percent: 90 },
    ]),
    note: "주요 성분 캡처 기준 · %는 1일 영양성분 기준치에 대한 비율",
  },
  {
    name: "지노마스터 질유산균 30캡슐",
    category: "영양제",
    status: "planned",
    startDate: null,
    endDate: null,
    schedule: "아침",
    frequencyPerDay: 1,
    unitsPerDose: 1,
    unitLabel: "캡슐",
    detail: "하루 1회 1캡슐 (170mg)",
    nutrients: JSON.stringify([
      { name: "프로바이오틱스", amount: "50억 CFU" },
      { name: "락토페린", amount: "54mg" },
    ]),
    note: "복용 예정 · 첨부 성분표 기준. 시작일과 세부 내용은 수정 버튼에서 변경 가능",
  },
  {
    name: "지노마스터 보라지유 60캡슐",
    category: "영양제",
    status: "planned",
    startDate: null,
    endDate: null,
    schedule: "아침",
    frequencyPerDay: 1,
    unitsPerDose: 2,
    unitLabel: "캡슐",
    detail: "하루 1회 2캡슐",
    nutrients: JSON.stringify([
      { name: "비타민 E", amount: "11mg α-TE", percent: 100 },
    ]),
    note: "복용 예정 · 감마리놀렌산 함유 유지 · 시작일과 세부 내용은 수정 버튼에서 변경 가능",
  },
];

const MEDICATION_SEED = [
  {
    name: "인데놀",
    dose: "10mg",
    slot: "저녁",
    onsetMin: 30,
    peakMin: 90,
    durationH: 8,
    nextDayDrowsiness: "가끔",
    note: "심박 안정용. 복용 직후 눕기보다 20~30분 루틴 후 취침 권장.",
  },
  {
    name: "산도스에스시탈로프람",
    dose: "5mg",
    slot: "저녁",
    onsetMin: 60,
    peakMin: 240,
    durationH: 24,
    nextDayDrowsiness: "거의 없음",
    note: "장기 유지형. 시간대 흔들림에 가장 민감하게 반응할 수 있음.",
  },
  {
    name: "디아제팜정",
    dose: "2mg",
    slot: "저녁",
    onsetMin: 15,
    peakMin: 60,
    durationH: 12,
    nextDayDrowsiness: "있음",
    note: "빠르게 시작되고 다음 날까지 남는 편. 복용 시각이 늦어지면 잔여 졸림이 길어질 수 있음.",
  },
  {
    name: "쿠에타핀정",
    dose: "50",
    slot: "저녁",
    onsetMin: 30,
    peakMin: 60,
    durationH: 8,
    nextDayDrowsiness: "있음",
    note: "식사와 함께 복용 시 흡수가 안정적. 복용 후 화면 노출은 졸림 시작을 늦춤.",
  },
  {
    name: "트라조돈",
    dose: "50mg",
    slot: "저녁",
    onsetMin: 30,
    peakMin: 90,
    durationH: 6,
    nextDayDrowsiness: "보통",
    note: "수면 유지에 관여. 너무 늦게 복용하면 기상 시각이 뒤로 밀리는 경향.",
  },
  {
    name: "클로나제팜",
    dose: "0.5mg",
    slot: "저녁",
    onsetMin: 20,
    peakMin: 60,
    durationH: 12,
    nextDayDrowsiness: "있음",
    note: "긴 반감기. 새벽 재복용은 다음 날 멍함을 키울 수 있어 기록이 필요함.",
  },
  {
    name: "벤라팍신염산염",
    dose: "150mg",
    slot: "아침",
    onsetMin: 60,
    peakMin: 180,
    durationH: 24,
    nextDayDrowsiness: "거의 없음",
    note: "아침 복용. 기상 시각에 맞춰 고정하는 편이 수면 리듬에 유리함.",
  },
  {
    name: "아빌리파이",
    dose: "1mg",
    slot: "아침",
    onsetMin: 120,
    peakMin: 360,
    durationH: 24,
    nextDayDrowsiness: "거의 없음",
    note: "아침 복용. 식사 여부에 따라 체감 시간이 달라질 수 있음.",
  },
];

const EVENT_SEED = [
  {
    date: "2026-09-29",
    time: "07:44",
    title: "아침 마음챙김 패키지 (5종)",
    memo: "기상 직후 · 식사와 함께",
    kind: "todo",
    done: 1,
  },
  {
    date: "2026-09-29",
    time: "13:00",
    title: "낮잠 20분 (15시 이전)",
    memo: "2시간 이상 낮잠은 다음 날 취침을 밀었음. 타이머 20분 설정.",
    kind: "todo",
    done: 0,
  },
  {
    date: "2026-09-29",
    time: "23:20",
    title: "밤 안식 수면 패키지 (6종)",
    memo: "목표 취침 00:00 — 복용 후 40분 루틴(조명 낮춤·화면 끄기)",
    kind: "todo",
    done: 0,
  },
  {
    date: "2026-09-29",
    time: null,
    title: "기상 후 컨디션 3줄 기록",
    memo: "개운함 / 잔여 졸림 / 낮 졸림 — 7일 실험용 항목",
    kind: "memo",
    done: 0,
  },
];

let seedPromise: Promise<void> | null = null;

/** 최초 조회 시 한 번만 시드 데이터를 넣는다. */
export function ensureSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const existing = await db.select({ id: sleepLogs.id }).from(sleepLogs).limit(1);
  if (existing.length > 0) return;

  await db.insert(sleepLogs).values(SLEEP_SEED).onConflictDoNothing();
  await db
    .insert(packLogs)
    .values(
      PACK_SEED.map(([date, time, pack, taken]) => ({ date, time, pack, taken })),
    )
    .onConflictDoNothing();
  await db
    .insert(waterLogs)
    .values(
      WATER_SEED.map(([date, time, amountMl, memo]) => ({
        date,
        time,
        amountMl,
        memo,
      })),
    )
    .onConflictDoNothing();
  await db.insert(medicationCourses).values(COURSE_SEED).onConflictDoNothing();
  await db.insert(medications).values(MEDICATION_SEED).onConflictDoNothing();
  await db.insert(dailyEvents).values(EVENT_SEED).onConflictDoNothing();
  await db
    .insert(appSettings)
    .values([{ key: "water_goal_ml", value: "2000" }])
    .onConflictDoNothing();
}
