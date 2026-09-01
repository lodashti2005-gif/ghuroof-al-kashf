import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Floor13Experience } from "@/components/floor13/floor13-experience";

/**
 * مدخل معاينة تطويري لمسرح جريمة «الطابق ١٣» (نسخة أولية).
 * غير مرتبط بمتجر القضايا ولا بالأسعار ولا بالتجربة المجانية — رابط مباشر فقط.
 */
export const Route = createFileRoute("/dev/floor13")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "معاينة الطابق ١٣ — ورا السالفة" },
      {
        name: "description",
        content: "معاينة تطويرية لمسرح جريمة ثلاثي الأبعاد قابل للمشي في الطابق ١٣، غرفة ١٣٠٦.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "معاينة الطابق ١٣ — ورا السالفة" },
      {
        property: "og:description",
        content: "نسخة أولية لمسرح جريمة ثلاثي الأبعاد داخل فندق قديم.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Floor13DevPage,
});

function Floor13DevPage() {
  const navigate = useNavigate();
  return <Floor13Experience onExit={() => navigate({ to: "/" })} />;
}
