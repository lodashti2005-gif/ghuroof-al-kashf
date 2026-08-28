/**
 * عزل بيانات المشتبه فيهم بين القضايا.
 *
 * كل قضية لها قائمة معرّفات مشتبهين خاصة بها ومدّة استجواب خاصة بها، فما
 * يتسرّب أي مفتاح من «الشاليه» لغرفة «آخر رحلة» أو العكس. الملف نصوص فقط
 * (بدون صور أو أسرار) حتى يكون آمن للاستيراد من أي مكان.
 */
export const CHALET_CASE_ID = "last-night";
export const LAST_TRIP_CASE_ID = "last-trip";

const CHALET_SUSPECT_IDS = ["fahad", "noura", "yousef", "dana"] as const;
const LAST_TRIP_SUSPECT_IDS = [
  "lt-jassim",
  "lt-salem",
  "lt-abdullah",
  "lt-mishal",
  "lt-nasser",
] as const;

/** ٥ دقائق لكل مشتبه فيه — نفس القيمة بالقضيتين. */
export const CASE_INTERROGATION_SECONDS = 5 * 60;

/** معرّفات مشتبهي القضية فقط — أي مفتاح ثاني يُعتبر تلوّث حالة ويُحذف. */
export function suspectIdsForCase(caseId: string): string[] {
  return caseId === LAST_TRIP_CASE_ID
    ? [...LAST_TRIP_SUSPECT_IDS]
    : [...CHALET_SUSPECT_IDS];
}

export function isSuspectOfCase(caseId: string, suspectId: string): boolean {
  return suspectIdsForCase(caseId).includes(suspectId);
}
