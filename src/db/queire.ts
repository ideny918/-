// 데이터 접근 계층 (Drizzle ORM)
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import {
  appSettings,
  dailyEvents,
  medicationCourses,
  medications,
  packLogs,
  sleepLogs,
  waterLogs,
  type DailyEvent,
  type Medication,
  type MedicationCourse,
  type PackLog,
  type SleepLog,
  type WaterLog,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getSleepLogs(): Promise<SleepLog[]> {
  await ensureSeed();
  return db.select().from(sleepLogs).orderBy(desc(sleepLogs.date));
}

export async function getPackLogs(): Promise<PackLog[]> {
  await ensureSeed();
  return db.select().from(packLogs).orderBy(desc(packLogs.date), desc(packLogs.time));
}

export async function getWaterLogs(): Promise<WaterLog[]> {
  await ensureSeed();
  return db.select().from(waterLogs).orderBy(desc(waterLogs.date), desc(waterLogs.time));
}

export async function getMedications(): Promise<Medication[]> {
  await ensureSeed();
  return db.select().from(medications).orderBy(medications.slot, medications.name);
}

export async function getMedicationCourses(): Promise<MedicationCourse[]> {
  await ensureSeed();
  return db
    .select()
    .from(medicationCourses)
    .orderBy(desc(medicationCourses.startDate), medicationCourses.name);
}

export interface MedicationCourseInput {
  name: string;
  category: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  schedule: string | null;
  frequencyPerDay: number;
  unitsPerDose: number;
  unitLabel: string;
  detail: string | null;
  nutrients: string | null;
  note: string | null;
}

export async function insertMedicationCourse(input: MedicationCourseInput): Promise<void> {
  await ensureSeed();
  await db
    .insert(medicationCourses)
    .values(input)
    .onConflictDoUpdate({
      target: medicationCourses.name,
      set: input,
    });
}

export async function updateMedicationCourse(
  id: number,
  input: MedicationCourseInput,
): Promise<void> {
  await ensureSeed();
  await db
    .update(medicationCourses)
    .set(input)
    .where(eq(medicationCourses.id, id));
}

export async function getEvents(): Promise<DailyEvent[]> {
  await ensureSeed();
  return db.select().from(dailyEvents).orderBy(dailyEvents.date, dailyEvents.time);
}

export async function upsertSleepLog(input: {
  date: string;
  bedtime: string | null;
  wakeup: string | null;
  sleepH: number | null;
  napH: number | null;
  morningCondition: string | null;
  preSleepMeds: string | null;
}): Promise<void> {
  await ensureSeed();
  await db
    .insert(sleepLogs)
    .values(input)
    .onConflictDoUpdate({
      target: sleepLogs.date,
      set: input,
    });
}

export async function insertPackLog(input: {
  date: string;
  pack: string;
  time: string | null;
  taken: number;
}): Promise<void> {
  await ensureSeed();
  await db.insert(packLogs).values(input);
}

export async function insertWaterLog(input: {
  date: string;
  time: string | null;
  amountMl: number;
  memo: string | null;
}): Promise<void> {
  await ensureSeed();
  await db.insert(waterLogs).values(input);
}

export async function insertEvent(input: {
  date: string;
  time: string | null;
  title: string;
  memo: string | null;
  kind: string;
}): Promise<void> {
  await ensureSeed();
  await db.insert(dailyEvents).values(input);
}

export async function getSetting(key: string, fallback: string): Promise<string> {
  await ensureSeed();
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);
  return row?.value ?? fallback;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureSeed();
  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } });
}

export async function toggleEvent(id: number): Promise<void> {
  await ensureSeed();
  const [row] = await db
    .select()
    .from(dailyEvents)
    .where(eq(dailyEvents.id, id))
    .limit(1);
  if (!row) return;
  await db
    .update(dailyEvents)
    .set({ done: row.done === 1 ? 0 : 1 })
    .where(eq(dailyEvents.id, id));
}
