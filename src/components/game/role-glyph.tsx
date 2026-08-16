import { FlaskConical, Mic, Search, Video } from "lucide-react";

import type { RoleIcon } from "@/game/roles";

/** أيقونة الدور — بديل ثابت للإيموجي حتى تبين على كل الأجهزة. */
export function RoleGlyph({ icon, className }: { icon: RoleIcon; className?: string }) {
  const Comp =
    icon === "search" ? Search : icon === "flask" ? FlaskConical : icon === "camera" ? Video : Mic;
  return <Comp className={className} aria-hidden="true" />;
}
