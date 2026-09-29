// 데이터베이스 스키마 정의 (Drizzle ORM, PostgreSQL)
import {
  pgTable,
  serial,
  text,
  real,
  integer,
} from "drizzle-orm/pg-core";

// 수면 기록: 하루 한 줄
export const sleepLogs = pgTable("sleep_logs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // YYYY-MM-DD
  bedtime: text("bedtime"), // 취침 시각 (24시간제 HH:MM)
  wakeup: text("wakeup"), // 기상 시각
  sleepH: real("sleep_h"), // 수면 시간(시간)
  napH: real("nap_h"), // 낮잠 시간(시간)
  morningCondition: text("morning_condition"), // 기상 컨디션 (최악~좋음)
  preSleepMeds: text("pre_sleep_meds"), // 취침 전후 복용약 요약
});

// 복용 체크: 약을 나열하지 않고 '패키지' 묶음 단위로만 기록한다
export const packLogs = pgTable("pack_logs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  pack: text("pack").notNull(), // 아침 마음챙김 패키지 (5종) / 밤 안식 수면 패키지 (6종)
  time: text("time"), // 실제 복용 시각 (없으면 시각 미기록)
  taken: integer("taken").notNull().default(1), // 0: 미복용, 1: 복용
});

// 앱 설정 (키/값) — 예: 하루 수분 목표량
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// 수분 섭취 기록
export const waterLogs = pgTable("water_logs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time"),
  amountMl: integer("amount_ml").notNull(),
  memo: text("memo"),
});

// 기간형 복용 항목 — 감기약·영양제처럼 시작일/종료일이 있는 항목
export const medicationCourses = pgTable("medication_courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull().default("기타"), // 감기약 / 영양제 / 기타
  status: text("status").notNull().default("active"), // planned / active / completed
  startDate: text("start_date"), // 복용 예정은 미정 가능
  endDate: text("end_date"), // 종료일이 없으면 현재 복용 중
  schedule: text("schedule"), // 아침 / 점심 / 저녁 / 필요시
  frequencyPerDay: integer("frequency_per_day").notNull().default(1),
  unitsPerDose: integer("units_per_dose").notNull().default(1),
  unitLabel: text("unit_label").notNull().default("개"),
  detail: text("detail"), // 용량·성분 등
  nutrients: text("nutrients"), // JSON 문자열
  note: text("note"),
});

// 등록된 약 (약효 곡선 표시용)
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  dose: text("dose"),
  slot: text("slot"), // 처방된 복용 시간대
  onsetMin: integer("onset_min"), // 약효 시작 체감(분)
  peakMin: integer("peak_min"), // 정점까지(분)
  durationH: real("duration_h"), // 지속 시간(시간)
  nextDayDrowsiness: text("next_day_drowsiness"), // 다음날 멍함/졸림 여부
  note: text("note"),
});

// 데일리 타임라인 이벤트 (일정/할 일/메모)
export const dailyEvents = pgTable("daily_events", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time"), // 시각(선택)
  title: text("title").notNull(),
  memo: text("memo"),
  kind: text("kind").notNull().default("todo"), // event / todo / memo
  done: integer("done").notNull().default(0), // 0: 미완료, 1: 완료
});

export type AppSetting = typeof appSettings.$inferSelect;
export type SleepLog = typeof sleepLogs.$inferSelect;
export type PackLog = typeof packLogs.$inferSelect;
export type WaterLog = typeof waterLogs.$inferSelect;
export type MedicationCourse = typeof medicationCourses.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type DailyEvent = typeof dailyEvents.$inferSelect;
