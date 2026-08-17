/**
 * Voice layer for the interrogation room.
 *
 * Speech OUT goes through ElevenLabs (`/api/public/tts`): a different real human
 * voice per suspect, with delivery driven by the suspect's emotional state and
 * stress. There is no browser-speech fallback: if ElevenLabs fails the exact
 * provider error is surfaced instead.
 *
 * Speech IN still uses the browser recogniser (mic button).
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { SuspectState } from "@/game/types";

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): RecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "ar-KW";
  rec.interimResults = false;
  rec.continuous = false;
  return rec;
}

export interface SpeakOptions {
  state?: SuspectState;
  stress?: number;
}

interface LastLine extends SpeakOptions {
  text: string;
}

export function useVoice({
  onTranscript,
  suspectId,
}: {
  onTranscript: (text: string) => void;
  suspectId: string;
}) {
  /** idle → listening → transcribing، حالة محلية لهذا اللاعب فقط. */
  const [micStatus, setMicStatus] = useState<"idle" | "listening" | "transcribing">("idle");
  const [micError, setMicError] = useState<string | null>(null);
  // Voice playback is ON by default: the suspect talks back out loud.
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [micSupported, setMicSupported] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);
  const recordingRef = useRef<MediaRecorder | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastRef = useRef<LastLine | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  // إذا منع المتصفح التشغيل التلقائي، نحفظ الصوت الجاهز ونشغّله لحظة أول
  // تفاعل من اللاعب مع الصفحة، وبعدها تشتغل كل الردود تلقائيًا.
  const pendingAudioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    setMicSupported(
      (typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia) ||
        !!getRecognition(),
    );

    const unlock = () => {
      unlockedRef.current = true;
      const pending = pendingAudioRef.current;
      pendingAudioRef.current = null;
      if (pending && !mutedRef.current) {
        setSpeaking(true);
        void pending.play().catch((error: unknown) => {
          console.error("ElevenLabs playback failed after user gesture", error);
          setSpeaking(false);
        });
      }
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, unlock, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, unlock));
      recRef.current?.stop();
      abortRef.current?.abort();
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  /**
   * Mic turn: record ONE complete file, then transcribe it on the server.
   * كل شي هنا محلي لهذا اللاعب: لو فشل المايك أو التحويل نرجع للكتابة بدون
   * تعليق شاشة الاستجواب عند أي لاعب ثاني.
   */
  const startListening = useCallback(async () => {
    if (recordingRef.current) return;
    setMicError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      // احتياط أخير: مُعرّف الكلام في المتصفح.
      const rec = getRecognition();
      if (!rec) {
        setMicError("المايك غير مدعوم بهذا المتصفح — استخدم الكتابة.");
        return;
      }
      recRef.current = rec;
      rec.onresult = (e) => {
        const text = e.results?.[0]?.[0]?.transcript ?? "";
        if (text.trim()) onTranscriptRef.current(text.trim());
      };
      rec.onerror = () => setMicStatus("idle");
      rec.onend = () => setMicStatus("idle");
      setMicStatus("listening");
      rec.start();
      return;
    }

    let stream: MediaStream;
    try {
      // إذن الميكروفون يُطلب مرة واحدة؛ المتصفح يتذكره بعدها.
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicStatus("idle");
      setMicError("ما عطيت إذن المايك — تقدر تكتب سؤالك.");
      return;
    }

    const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find(
      (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t),
    );
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus("idle");
      setMicError("تعذر تشغيل المايك — استخدم الكتابة.");
      return;
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      recordingRef.current = null;
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      if (blob.size < 2048) {
        setMicStatus("idle");
        setMicError("التسجيل فاضي — جرّب مرة ثانية.");
        return;
      }
      setMicStatus("transcribing");
      const form = new FormData();
      form.append("file", blob, "question.webm");
      void fetch("/api/public/stt", { method: "POST", body: form })
        .then(async (res) => {
          const data = (await res.json().catch(() => null)) as { text?: string } | null;
          if (!res.ok || !data?.text?.trim()) throw new Error("stt_failed");
          onTranscriptRef.current(data.text.trim());
        })
        .catch((error: unknown) => {
          console.error("speech-to-text failed", error);
          setMicError("ما فهمنا التسجيل — اكتب سؤالك أو جرّب مرة ثانية.");
        })
        .finally(() => setMicStatus("idle"));
    };

    recordingRef.current = recorder;
    setMicStatus("listening");
    recorder.start();
  }, []);

  const stopListening = useCallback(() => {
    const recorder = recordingRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }
    recRef.current?.stop();
    setMicStatus("idle");
  }, []);


  /** Hard-stop whatever is currently playing or being generated. */
  const stopSpeaking = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    pendingAudioRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeaking(false);
    setLoadingVoice(false);
  }, []);

  const play = useCallback(
    async (line: LastLine) => {
      const text = line.text.trim();
      if (!text) return;
      lastRef.current = line;
      if (mutedRef.current) return;

      // One suspect voice at a time — never let two replies overlap.
      stopSpeaking();
      setVoiceError(null);
      setLoadingVoice(true);

      const key = `${suspectId}|${line.state ?? "calm"}|${text}`;
      let src = audioCache.get(key);

      if (!src) {
        const controller = new AbortController();
        abortRef.current = controller;
        // مهلة معقولة: إذا تأخر ElevenLabs نكمل باللعبة نصياً بدون تعليق،
        // ومحاولة واحدة فقط — بدون أي إعادة طلب تلقائي.
        const timer = window.setTimeout(() => controller.abort(), 45_000);
        try {
          const res = await fetch("/api/public/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              suspectId,
              text,
              state: line.state ?? "calm",
              stress: Math.round(line.stress ?? 0),
            }),
            signal: controller.signal,
          });
          const type = res.headers.get("Content-Type") ?? "";
          if (!res.ok || !type.startsWith("audio/")) {
            const detail = await res.text().catch(() => "");
            console.error("ElevenLabs voice unavailable", res.status, detail.slice(0, 300));
            setLoadingVoice(false);
            setVoiceError("الصوت غير متوفر حالياً — الرد النصي موجود.");
            return;
          }
          const blob = await res.blob();
          src = URL.createObjectURL(blob);
          // إعادة استخدام نفس الملف لنفس الرد (زر 🔊) بدون استهلاك credits.
          cacheAudio(key, src);
        } catch (error) {
          setLoadingVoice(false);
          if (controller.signal.aborted && !abortRef.current) return; // stopSpeaking
          console.error("ElevenLabs voice request failed", error);
          setVoiceError("الصوت تأخر — كمل بالنص.");
          return;
        } finally {
          window.clearTimeout(timer);
          abortRef.current = null;
        }
      }

      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.preload = "auto";
      audio.src = src;
      audio.onended = () => setSpeaking(false);
      audio.onplaying = () => {
        setLoadingVoice(false);
        setSpeaking(true);
      };
      audio.onerror = () => {
        setLoadingVoice(false);
        setSpeaking(false);
      };

      try {
        await audio.play();
        unlockedRef.current = true;
      } catch (error) {
        const blocked = error instanceof DOMException && error.name === "NotAllowedError";
        setLoadingVoice(false);
        setSpeaking(false);
        if (blocked && !unlockedRef.current) {
          // ننتظر أول تفاعل ثم نشغّل نفس الملف مرة واحدة — بدون رسالة خطأ.
          console.warn("autoplay blocked; waiting for first user gesture");
          pendingAudioRef.current = audio;
          return;
        }
        console.error("suspect voice playback failed", error);
      }
    },
    [stopSpeaking, suspectId],
  );



  /** Speak a suspect line with its emotional delivery. */
  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      void play({ text, ...options });
    },
    [play],
  );

  /** Replay the last suspect reply. */
  const replay = useCallback(() => {
    const last = lastRef.current;
    if (last) void play(last);
  }, [play]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m) stopSpeaking();
      return !m;
    });
  }, [stopSpeaking]);

  return {
    listening: micStatus === "listening",
    micStatus,
    micError,
    clearMicError: () => setMicError(null),
    startListening,
    stopListening,
    micSupported,
    muted,
    toggleMute,
    speak,
    replay,
    stopSpeaking,
    speaking,
    loadingVoice,
    voiceError,
    hasLast: !!lastRef.current,
  };
}
