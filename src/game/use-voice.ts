/**
 * Voice layer for the interrogation room.
 *
 * Speech OUT goes through ElevenLabs (`/api/public/tts`): a different real human
 * voice per suspect, with delivery driven by the suspect's emotional state and
 * stress. Browser `speechSynthesis` is kept only as an emergency fallback if the
 * ElevenLabs request fails, so a broken audio call never blocks the session.
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
  const [listening, setListening] = useState(false);
  // Voice playback is ON by default: the suspect talks back out loud.
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastRef = useRef<LastLine | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    setMicSupported(!!getRecognition());
    return () => {
      recRef.current?.stop();
      abortRef.current?.abort();
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const startListening = useCallback(() => {
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    rec.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript ?? "";
      if (text.trim()) onTranscriptRef.current(text.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }, []);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  /** Hard-stop whatever is currently playing or being generated. */
  const stopSpeaking = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
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

  /** Emergency-only fallback so a failed ElevenLabs call still gives audio. */
  const fallbackSpeak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/[«»"”“…]/g, " ").trim());
    utter.lang = "ar-SA";
    utter.rate = 0.95;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  const play = useCallback(
    async (line: LastLine) => {
      const text = line.text.trim();
      if (!text) return;
      lastRef.current = line;
      if (mutedRef.current) return;

      // One suspect voice at a time — never let two replies overlap.
      stopSpeaking();
      setVoiceError(false);
      setLoadingVoice(true);

      const controller = new AbortController();
      abortRef.current = controller;

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
        if (!res.ok) throw new Error(`tts ${res.status}`);
        // The endpoint answers with JSON (not audio) when the voice provider
        // is unavailable — treat that as a fallback signal, not a crash.
        if (!(res.headers.get("Content-Type") ?? "").startsWith("audio/")) {
          throw new Error("tts_fallback");
        }
        const blob = await res.blob();

        if (controller.signal.aborted) return;

        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = url;
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => setSpeaking(false);
        setLoadingVoice(false);
        setSpeaking(true);
        await audio.play().catch(() => setSpeaking(false));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("elevenlabs playback failed", error);
        setLoadingVoice(false);
        setVoiceError(true);
        fallbackSpeak(text);
      }
    },
    [fallbackSpeak, stopSpeaking, suspectId],
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
    listening,
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
