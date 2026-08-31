/**
 * بوابة التجربة (١٠ دقائق) لصفحات اللعب — بدون حساب، مربوطة بالجهاز/المتصفح.
 *
 * المنطق كله في `DeviceTrialGate`: ما نطلب حساب قبل التجربة، الوقت يبدأ بالزر
 * فقط، محفوظ بالخادم، ومرة واحدة لكل جهاز. الملكية المؤكدة تتجاوز البوابة.
 */
import { DeviceTrialBadge, DeviceTrialGate } from "@/components/game/device-trial-gate";

export function CaseTrialGate({
  caseId,
  children,
}: {
  caseId: string;
  children: React.ReactNode;
}) {
  return (
    <DeviceTrialGate caseId={caseId}>
      {children}
      <span className="pointer-events-none fixed bottom-4 left-4 z-50 backdrop-blur">
        <DeviceTrialBadge caseId={caseId} />
      </span>
    </DeviceTrialGate>
  );
}
