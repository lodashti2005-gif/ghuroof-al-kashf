/**
 * تجربة مجانية ١٠ دقائق لقضية «آخر رحلة» — بدون حساب، مربوطة بالجهاز/المتصفح.
 *
 * المنطق كله في `DeviceTrialGate`: الوقت يبدأ بضغط «ابدأ التجربة» فقط، محفوظ
 * بقاعدة البيانات، ما يتصفّر بالـrefresh، ومرة واحدة لكل جهاز. الشراء المؤكد
 * يتجاوز البوابة بدون مسح أي تقدم.
 */
import { DeviceTrialBadge, DeviceTrialGate } from "@/components/game/device-trial-gate";

const CASE_ID = "last-trip";

export function LastTripTrialBadge() {
  return <DeviceTrialBadge caseId={CASE_ID} />;
}

export function LastTripTrialGate({ children }: { children: React.ReactNode }) {
  return <DeviceTrialGate caseId={CASE_ID}>{children}</DeviceTrialGate>;
}
