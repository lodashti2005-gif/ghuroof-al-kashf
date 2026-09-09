/**
 * غرفة اللاعبين لقضية «آخر رحلة» فقط.
 *
 * تفتح غرفة أونلاين بنفس نظام الغرف المشترك (room-store) لكن بـ case_id
 * الخاص بهذي القضية، فالأدلة والأدوار والاتهام يتزامنون بين اللاعبين.
 * ما تلمس قضية الشاليه ولا مسار /lobby الخاص بها.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Copy, Crown, KeyRound, Play, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ActionButton } from "@/components/game/shell";
import { CaseTag, Eyebrow, Panel } from "@/components/game/ui";
import { getCaseById } from "@/game/game-meta";
import { ROOM_ERROR_EN } from "@/game/room-store";
import { useRoom } from "@/game/use-room";
import { useI18n } from "@/i18n";
import { lastTripT } from "@/game/cases/last-trip-strings";

const LAST_TRIP_CASE_ID = "last-trip";
const lastTripMeta = getCaseById(LAST_TRIP_CASE_ID);

export const Route = createFileRoute("/last-trip/lobby")({
  head: () => ({
    meta: [
      { title: "غرفة اللاعبين — آخر رحلة | ورا السالفة" },
      {
        name: "description",
        content:
          "افتح غرفة قضية «آخر رحلة» أو ادخل برمز غرفة أصحابك، وابدأوا التحقيق بمحطة الطريق مع فريق واحد.",
      },
      { property: "og:title", content: "غرفة اللاعبين — آخر رحلة" },
      {
        property: "og:description",
        content: "كل الفريق بغرفة واحدة، نفس الأدلة ونفس مراحل التحقيق.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LastTripLobby,
});

function LastTripLobby() {
  const { room, isHost, actions } = useRoom();
  const navigate = useNavigate();
  const { lang, dir, pick } = useI18n();
  const tt = (key: Parameters<typeof lastTripT>[1], vars?: Record<string, string | number>) =>
    lastTripT(lang, key, vars);
  const [mode, setMode] = useState<null | "create" | "join">(null);
  const [copied, setCopied] = useState(false);

  const inLastTripRoom = !!room && room.caseId === LAST_TRIP_CASE_ID;

  // إذا المضيف بدأ القضية، كل اللاعبين ينتقلون للمقدمة بنفس الوقت.
  useEffect(() => {
    if (inLastTripRoom && room && room.phase !== "lobby") {
      navigate({ to: "/last-trip/intro" });
    }
  }, [inLastTripRoom, room, navigate]);

  const copy = () => {
    if (!room) return;
    void navigator.clipboard?.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const BackArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/cases" className="font-display text-xs text-muted-foreground hover:text-foreground">
            {tt("backToCases")}
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            {tt("fileCode", { code: lastTripMeta?.code ?? "K-0472" })}
          </span>
        </header>

        <div className="cine-in mt-8">
          <Eyebrow>{tt("lobbyEyebrow")}</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {pick(lastTripMeta?.title, lastTripMeta?.titleEn) ?? tt("lobbyDefaultTitle")}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {pick(lastTripMeta?.teaser, lastTripMeta?.teaserEn)}
          </p>
        </div>

        {room && !inLastTripRoom ? (
          <Panel className="mt-8">
            <p className="text-sm leading-relaxed">{tt("inOtherRoom")}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ActionButton
                variant="outline"
                onClick={() => {
                  actions.leaveRoom();
                }}
              >
                <X className="size-4" /> {tt("leaveCurrentRoom")}
              </ActionButton>
              <Link
                to="/lobby"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 font-display text-sm"
              >
                {tt("backToMyRoom")}
              </Link>
            </div>
          </Panel>
        ) : inLastTripRoom && room ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <Panel className="cine-in">
              <Eyebrow>{tt("roomCode")}</Eyebrow>
              <div className="mt-3 flex items-center gap-3">
                <p dir="ltr" className="font-mono text-4xl tracking-[0.35em] sm:text-5xl">
                  {room.code}
                </p>
                <button
                  type="button"
                  onClick={copy}
                  aria-label={tt("copyCode")}
                  className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-muted-foreground transition-colors hover:text-primary"
                >
                  {copied ? <Check className="size-4 text-evidence" /> : <Copy className="size-4" />}
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{tt("shareCode")}</p>

              {isHost ? (
                <ActionButton
                  className="mt-6 w-full py-3.5 text-base"
                  onClick={() => {
                    actions.startIntro();
                    navigate({ to: "/last-trip/intro" });
                  }}
                >
                  <Play className="size-4.5" /> {tt("startCase")}
                </ActionButton>
              ) : (
                <p className="mt-6 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-center text-sm text-muted-foreground">
                  {tt("waitForHost")}
                </p>
              )}
            </Panel>

            <Panel className="cine-in">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <h2 className="font-display text-base font-bold">{tt("investigatorsInRoom")}</h2>
                </div>
                <CaseTag>{room.players.length}</CaseTag>
              </div>
              <ul className="mt-4 space-y-2.5">
                {room.players.map((p, i) => (
                  <li
                    key={p.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary font-mono text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="truncate text-sm">{p.name}</span>
                    </div>
                    {p.isHost && (
                      <CaseTag tone="danger">
                        <Crown className="size-3" /> {tt("host")}
                      </CaseTag>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ActionButton onClick={() => setMode("create")} className="px-6 py-3.5 text-base">
              <Play className="size-4.5" /> {tt("openNewRoom")}
            </ActionButton>
            <ActionButton
              variant="outline"
              onClick={() => setMode("join")}
              className="px-6 py-3.5 text-base"
            >
              <KeyRound className="size-4.5" /> {tt("joinWithCode")}
            </ActionButton>
            <Link
              to="/last-trip/intro"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-3.5 font-display text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {tt("playSolo")}
            </Link>
          </div>
        )}
      </div>

      {mode && <EntryModal mode={mode} onClose={() => setMode(null)} />}
    </div>
  );
}

function EntryModal({ mode, onClose }: { mode: "create" | "join"; onClose: () => void }) {
  const { actions } = useRoom();
  const { lang } = useI18n();
  const tt = (key: Parameters<typeof lastTripT>[1], vars?: Record<string, string | number>) =>
    lastTripT(lang, key, vars);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const nickname = name.trim();
    if (nickname.length < 2) {
      setError(tt("nameTooShort"));
      return;
    }
    if (mode === "join" && !/^\d{6}$/.test(code.trim())) {
      setError(tt("codeMustBe6"));
      return;
    }
    setError(null);
    setBusy(true);
    const res =
      mode === "create"
        ? await actions.createRoom(nickname, LAST_TRIP_CASE_ID)
        : await actions.joinRoom(code.trim(), nickname);
    setBusy(false);
    if (!res.ok) {
      const localized =
        lang === "en" && res.errorCode ? ROOM_ERROR_EN[res.errorCode] : res.error;
      setError(localized ?? tt("couldNotJoin"));
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="surface-panel cine-in w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>{mode === "create" ? tt("newRoomTitle") : tt("joinRoomTitle")}</Eyebrow>
            <h2 className="mt-1 text-2xl font-bold">
              {mode === "create" ? tt("createRoomCta") : tt("joinRoomCta")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tt("close")}
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm text-muted-foreground">{tt("yourName")}</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={tt("namePlaceholder")}
              maxLength={18}
              className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-base outline-none focus:border-primary/60"
            />
          </label>

          {mode === "join" && (
            <label className="block">
              <span className="mb-2 block text-sm text-muted-foreground">{tt("roomCodeLabel")}</span>
              <input
                value={code}
                inputMode="numeric"
                dir="ltr"
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                placeholder="000000"
                className="w-full rounded-xl border border-input bg-surface-2 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:border-primary/60"
              />
            </label>
          )}

          {error && (
            <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              {error}
            </p>
          )}

          <ActionButton type="submit" disabled={busy} className="w-full py-3.5 text-base">
            {busy ? tt("loadingDots") : mode === "create" ? tt("createRoomSubmit") : tt("joinRoomSubmit")}{" "}
            <ArrowLeft className="size-4" />
          </ActionButton>
        </form>
      </div>
    </div>
  );
}
