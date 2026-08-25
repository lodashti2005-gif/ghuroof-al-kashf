/**
 * شهادات الشهود القابلة للمواجهة بقضية «آخر رحلة» — آمنة للعرض.
 *
 * كلها معلومات معلنة أصلاً ببطاقات الشخصيات، فما فيها كشف للحل.
 */
export interface LastTripWitnessClaim {
  id: string;
  label: string;
  /** نص المواجهة اللي يُقرأ على المشتبه فيه. */
  text: string;
  /** الشاهد صاحب القول. */
  source: string;
  /** المشتبه فيهم اللي هذا القول يخصهم — يظهر عندهم فقط. */
  targetSuspects: string[];
}

export const lastTripWitnessClaims: LastTripWitnessClaim[] = [
  {
    id: "nasser-wet",
    label: "شهادة ناصر — إيد وكم مبلول",
    text: "ناصر يقول إنه شافك راجع صوب الكوفي وإيدك مبلولة وكم ثوبك مبلول شوي، وكنت مستعيل.",
    source: "ناصر",
    targetSuspects: ["lt-jassim"],
  },
  {
    id: "mishal-trash",
    label: "شهادة مشعل — رمي شي بالزبالة",
    text: "مشعل يقول إنه شافك عند مدخل الكوفي ترمي شي بحاوية الزبالة.",
    source: "مشعل",
    targetSuspects: ["lt-jassim"],
  },
  {
    id: "mishal-argue",
    label: "شهادة مشعل — صوت مهاوشة",
    text: "مشعل يقول إنه سمع رجّالين يتهاوشون من جهة الحمام البعيد، وصوت واحد منهم يشبه صوتك.",
    source: "مشعل",
    targetSuspects: ["lt-jassim", "lt-salem"],
  },
];

export const lastTripWitnessMap: Record<string, LastTripWitnessClaim> = Object.fromEntries(
  lastTripWitnessClaims.map((c) => [c.id, c]),
);

/** أقوال الشهود اللي تخص هذا المشتبه فيه فقط. */
export function lastTripWitnessClaimsForSuspect(suspectId: string) {
  return lastTripWitnessClaims.filter((c) => c.targetSuspects.includes(suspectId));
}

/** هل هذا القول قابل للمواجهة مع هذا المشتبه فيه؟ */
export function isLastTripWitnessUsable(suspectId: string, claimId: string) {
  const claim = lastTripWitnessMap[claimId];
  return !!claim && claim.targetSuspects.includes(suspectId);
}
