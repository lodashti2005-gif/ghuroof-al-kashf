import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldAlert, Users } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { caseFile } from "@/game/case-data";
import { useRoom } from "@/game/use-room";
import { roleById } from "@/game/roles";
import { RoleGlyph } from "@/components/game/role-glyph";
import { useI18n } from "@/i18n";

/**
 * Shell for every in-game screen. Guards the route: a player without a room is
 * sent back to the landing screen.
 */
export function GameShell({
  children,
  title,
  right,
  requireRoom = true,
}: {
  children: ReactNode;
  title?: string;
  right?: ReactNode;
  requireRoom?: boolean;
}) {
  const { room, me } = useRoom();
  const navigate = useNavigate();
  const { pick } = useI18n();
  const myRole = roleById(me ? room?.roles?.[me.id] : undefined);

  useEffect(() => {
    if (!requireRoom) return;
    const t = setTimeout(() => {
      if (!room) navigate({ to: "/" });
    }, 400);
    return () => clearTimeout(t);
  }, [room, navigate, requireRoom]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="grid size-9 shrink-0 place-items-center rounded-lg file-tape">
              <ShieldAlert className="size-4.5" />
            </Link>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold">{title ?? pick(caseFile.title, caseFile.titleEn)}</p>
              <p className="truncate font-mono text-[0.68rem] text-muted-foreground">
                {pick(`ملف ${caseFile.code}`, `File ${caseFile.code}`)}
                {room ? pick(` · غرفة ${room.code}`, ` · Room ${room.code}`) : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {room && (
              <span className="hidden items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground sm:inline-flex">
                <Users className="size-3.5" />
                {room.players.length}
              </span>
            )}
            {myRole && (
              <span
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs"
                title={pick(myRole.mission, myRole.missionEn)}
              >
                <RoleGlyph icon={myRole.icon} className="size-3.5 text-primary" />
                <span className="hidden sm:inline">{pick(myRole.title, myRole.titleEn)}</span>
              </span>
            )}
            {right}
            {me && (
              <span className="max-w-[7rem] truncate rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs">
                {me.name}
              </span>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8">{children}</main>
    </div>
  );
}

export function ActionButton({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-display text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" && "file-tape hover:brightness-110",
        variant === "outline" &&
          "border border-border bg-secondary/60 text-foreground hover:border-primary/50 hover:bg-secondary",
        variant === "ghost" && "text-muted-foreground hover:text-foreground",
        variant === "danger" &&
          "border border-primary/50 bg-primary/12 text-primary hover:bg-primary/20",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function LeaveRoomButton() {
  const { actions } = useRoom();
  const navigate = useNavigate();
  const { pick } = useI18n();
  return (
    <button
      type="button"
      onClick={() => {
        actions.leaveRoom();
        navigate({ to: "/" });
      }}
      className="grid size-9 place-items-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:text-primary"
      aria-label={pick("خروج من الغرفة", "Leave the room")}
    >
      <LogOut className="size-4" />
    </button>
  );
}
