/**
 * التحقق من التناقضات (Server-only).
 *
 * النموذج يرصد التناقض، بس ما نثق فيه أعمى: كل تناقض لازم يكون مربوط بحقيقة
 * موجودة فعلاً — قول سابق من نفس الجلسة، دليل مكتشف عند المحققين، أو جدول
 * القضية الزمني المعروف. أي تناقض ما نقدر نرجعه لمصدر حقيقي، أو تناقض صياغة
 * بسيط (اختلاف كلمات بلا معنى)، ينرفض ولا ينسجل بملف القضية.
 */
import { evidence, caseFile } from "@/game/case-data";
import type { SuspectProfile } from "@/game/profiles.server";
import type { InterrogationInput } from "./interrogation.functions";

export interface ContradictionNote {
  claim: string;
  conflictsWith: string;
  source: "statement" | "evidence" | "timeline";
  evidenceId?: string;
}

function normalize(text: string) {
  return text
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0621-\u064A0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string) {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length >= 3);
}

/** نسبة الكلمات المشتركة — للتأكد إن القول فعلاً من كلام المشتبه فيه. */
function overlap(a: string, b: string) {
  const wa = words(a);
  const wb = new Set(words(b));
  if (wa.length === 0) return 0;
  return wa.filter((w) => wb.has(w)).length / wa.length;
}

/** حقائق القضية الثابتة المسموح الاستناد عليها (جدول زمني + وقائع). */
export function caseTimelineFacts() {
  return [
    `وقت الوفاة: ${caseFile.victim.timeOfDeath}`,
    `موقع الجثة: ${caseFile.victim.location}`,
    `سبب الوفاة: ${caseFile.victim.cause}`,
    "الباب ما كان مكسور، وتلفون المجني عليه مفقود من الشاليه.",
  ];
}

/**
 * يرجّع تناقضاً صالحاً أو null. الشروط:
 * - نص القول والتعارض معقولان بالطول (مو كلمة واحدة).
 * - المصدر الحقيقي موجود: دليل مكتشف / قول سابق فعلي / حقيقة من جدول القضية.
 * - التناقض مو مجرد إعادة صياغة (تشابه شبه كامل بين الطرفين).
 */
export function validateContradiction(
  raw: Partial<ContradictionNote> | null | undefined,
  data: InterrogationInput,
  profile: SuspectProfile,
): ContradictionNote | null {
  if (!raw) return null;
  const claim = String(raw.claim ?? "").trim();
  const conflictsWith = String(raw.conflictsWith ?? "").trim();
  if (claim.length < 8 || conflictsWith.length < 8) return null;
  if (words(claim).length < 3 || words(conflictsWith).length < 3) return null;

  // إعادة صياغة لنفس الكلام ما تُعد تناقضاً.
  if (overlap(claim, conflictsWith) >= 0.8) return null;

  const source = raw.source === "evidence" || raw.source === "timeline" ? raw.source : "statement";

  if (source === "evidence") {
    const id = String(raw.evidenceId ?? "");
    if (!data.unlockedEvidence.includes(id)) return null;
    const item = evidence.find((e) => e.id === id);
    if (!item) return null;
    return { claim, conflictsWith: `${item.title}: ${item.description}`, source, evidenceId: id };
  }

  if (source === "timeline") {
    const facts = caseTimelineFacts();
    const grounded = facts.some((f) => overlap(conflictsWith, f) >= 0.3);
    if (!grounded) return null;
    return { claim, conflictsWith, source };
  }

  // قول سابق: لازم يكون فعلاً موجود بأقوال المشتبه فيه بهذي الجلسة.
  const priorStatements = data.transcript.filter((m) => m.role === "suspect").map((m) => m.text);
  const match = priorStatements.find((t) => overlap(conflictsWith, t) >= 0.45);
  if (!match) return null;
  // ولازم يكون التعارض له سند بالتناقضات المكتوبة بملف الشخصية أو بحقائق القضية،
  // حتى ما يخترع النموذج تناقضات ما لها علاقة بالقصة.
  const anchors = [...profile.contradictions, ...profile.publicStory, ...profile.trueTimeline];
  const anchored = anchors.some((a) => overlap(claim, a) >= 0.2 || overlap(match, a) >= 0.2);
  if (!anchored) return null;

  return { claim, conflictsWith: match, source: "statement" };
}
