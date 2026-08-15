/**
 * Short cinematic "evidence discovered" sting, synthesized with WebAudio so we
 * don't ship an audio asset. Safe to call from a click handler only (autoplay).
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function playDiscoverySting() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  const master = ac.createGain();
  master.gain.value = 0.18;
  master.connect(ac.destination);

  // Two rising tones (camera-shutter-ish reveal) + a soft low thump.
  const tones: Array<[number, number, number]> = [
    [880, 0, 0.16],
    [1320, 0.09, 0.28],
  ];
  for (const [freq, at, dur] of tones) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + at);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + at + dur);
    g.gain.setValueAtTime(0.0001, now + at);
    g.gain.exponentialRampToValueAtTime(0.9, now + at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
    osc.connect(g).connect(master);
    osc.start(now + at);
    osc.stop(now + at + dur + 0.05);
  }

  const sub = ac.createOscillator();
  const subGain = ac.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(120, now);
  sub.frequency.exponentialRampToValueAtTime(55, now + 0.45);
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.7, now + 0.03);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  sub.connect(subGain).connect(master);
  sub.start(now);
  sub.stop(now + 0.55);
}
