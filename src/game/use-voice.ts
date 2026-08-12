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

/** Per-suspect voice colouring (kept provider-agnostic on purpose). */
export interface VoiceProfile {
  /** Preferred gender when several Arabic voices are installed. */
  gender?: "male" | "female";
  rate?: number;
  pitch?: number;
}

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

const FEMALE_HINTS = ["female", "woman", "hala", "zariyah", "laila", "salma", "amira", "sara"];
const MALE_HINTS = ["male", "man", "maged", "tarik", "naayf", "hamed", "khalid"];

/** Pick the best installed Arabic voice, biased toward the requested gender. */
function pickVoice(profile?: VoiceProfile): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const arabic = voices.filter((v) => v.lang?.toLowerCase().startsWith("ar"));
  if (arabic.length === 0) return null;
  const hints = profile?.gender === "female" ? FEMALE_HINTS : MALE_HINTS;
  const match = arabic.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  return match ?? arabic[0] ?? null;
}

export function useVoice({
  onTranscript,
  profile,
}: {
  onTranscript: (text: string) => void;
  profile?: VoiceProfile;
}) {
  const [listening, setListening] = useState(false);
  // Voice playback is ON by default: the suspect talks back out loud.
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    setMicSupported(!!getRecognition());
    const synth = typeof window === "undefined" ? undefined : window.speechSynthesis;
    setTtsSupported(!!synth);
    // Voice list loads async in most browsers.
    const load = () => {
      voiceRef.current = pickVoice(profileRef.current);
    };
    load();
    synth?.addEventListener?.("voiceschanged", load);
    return () => {
      synth?.removeEventListener?.("voiceschanged", load);
      recRef.current?.stop();
      synth?.cancel();
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
      const clean = text.replace(/[«»"”“]/g, " ").trim();
      if (!clean) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      const picked = voiceRef.current ?? pickVoice(profileRef.current);
      voiceRef.current = picked;
      if (picked) utter.voice = picked;
      utter.lang = picked?.lang ?? "ar-SA";
      utter.rate = profileRef.current?.rate ?? 0.95;
      utter.pitch = profileRef.current?.pitch ?? 0.9;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
      // Safety net: some engines never fire onstart.
      setSpeaking(true);
    },
    [muted],
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m && typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
      }
      return !m;
    });
  }, []);

  return {
    listening,
    startListening,
    stopListening,
    micSupported,
    ttsSupported,
    muted,
    toggleMute,
    speak,
    stopSpeaking,
    speaking,
  };
}
