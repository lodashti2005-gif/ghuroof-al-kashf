/**
 * شهادات الشهود القابلة للمواجهة بقضية «آخر رحلة» — آمنة للعرض.
 *
 * كلها معلومات معلنة أصلاً ببطاقات الشخصيات، فما فيها كشف للحل.
 */
export interface LastTripWitnessClaim {
  id: string;
  label: string;
  labelEn: string;
  /** نص المواجهة اللي يُقرأ على المشتبه فيه. */
  text: string;
  textEn: string;
  /** الشاهد صاحب القول. */
  source: string;
  sourceEn: string;
  /** المشتبه فيهم اللي هذا القول يخصهم — يظهر عندهم فقط. */
  targetSuspects: string[];
}

export const lastTripWitnessClaims: LastTripWitnessClaim[] = [
  {
    id: "nasser-wet",
    label: "شهادة ناصر — إيد وكم مبلول",
    labelEn: "Nasser's statement — wet hand and sleeve",
    text: "ناصر يقول إنه شافك راجع صوب الكوفي وإيدك مبلولة وكم ثوبك مبلول شوي، وكنت مستعيل.",
    textEn:
      "Nasser says he saw you heading back to the coffee shop with a wet hand and a slightly wet sleeve, and you seemed in a hurry.",
    source: "ناصر",
    sourceEn: "Nasser",
    targetSuspects: ["lt-jassim"],
  },
  {
    id: "mishal-trash",
    label: "شهادة مشعل — رمي شي بالزبالة",
    labelEn: "Mishal's statement — throwing something in the trash",
    text: "مشعل يقول إنه شافك عند مدخل الكوفي ترمي شي بحاوية الزبالة.",
    textEn: "Mishal says he saw you at the coffee shop entrance throwing something in the trash bin.",
    source: "مشعل",
    sourceEn: "Mishal",
    targetSuspects: ["lt-jassim"],
  },
  {
    id: "mishal-argue",
    label: "شهادة مشعل — صوت مهاوشة",
    labelEn: "Mishal's statement — sound of an argument",
    text: "مشعل يقول إنه سمع رجّالين يتهاوشون من جهة الحمام البعيد، وصوت واحد منهم يشبه صوتك.",
    textEn:
      "Mishal says he heard two men arguing from the direction of the far bathroom, and one voice sounded like yours.",
    source: "مشعل",
    sourceEn: "Mishal",
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
