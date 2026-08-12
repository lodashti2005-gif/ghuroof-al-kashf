/**
 * Voice layer for the interrogation room.
 *
 * Today it uses the browser's built-in speech APIs so mic + audio replies work
 * with zero configuration. The exported surface (`listening`, `start`, `stop`,
 * `speak`, `muted`) is provider-agnostic, so swapping in ElevenLabs (or any
 * STT/TTS provider through a server function) later only replaces the bodies.
 */
import { useCallback, useEffect, useRef, useState } from "react";

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
  const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "ar-KW";
  rec.interimResults = false;
  rec.continuous = false;
  return rec;
}

export function useVoice({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    setMicSupported(!!getRecognition());
    return () => {
      recRef.current?.stop();
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

  /** Speak a suspect line. No-op while muted; provider swap happens here. */
  const speak = useCallback(
    (text: string) => {
      if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ar-SA";
      utter.rate = 0.95;
      utter.pitch = 0.9;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
    },
    [muted],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m && typeof window !== "undefined") window.speechSynthesis?.cancel();
      return !m;
    });
  }, []);

  return { listening, startListening, stopListening, micSupported, muted, toggleMute, speak, speaking };
}
