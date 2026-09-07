import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { CaseNotebook } from "@/components/game/case-notebook";
import { ActionButton, GameShell, LeaveRoomButton } from "@/components/game/shell";
import { TurnBanner } from "@/components/game/turn-banner";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/notebook")({
  head: () => ({
    meta: [
      { title: "دفتر القضية — ورا السالفة" },
      {
        name: "description",
        content:
          "دفتر القضية المشترك: الأدلة المكتشفة، أقوال المشتبه فيهم، التناقضات، التسلسل الزمني وملاحظات الفريق.",
      },
      { property: "og:title", content: "دفتر القضية" },
      {
        property: "og:description",
        content: "كل ما اكتشفه فريقك بمكان واحد — متزامن لحظياً بين كل اللاعبين.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotebookPage,
});

function NotebookPage() {
  const navigate = useNavigate();
  const { t, dir } = useI18n();
  const Back = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <GameShell title={t("notebook.title")} right={<LeaveRoomButton />}>
      <div className="space-y-5">
        <TurnBanner />
        <CaseNotebook />
        <ActionButton variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
          <Back className="size-4" /> {t("notebook.back")}
        </ActionButton>
      </div>
    </GameShell>
  );
}
