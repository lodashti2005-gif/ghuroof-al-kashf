import { getLastTripRules } from "../src/game/cases/last-trip-interrogation.server";
import { buildLastTripPrompt } from "../src/lib/last-trip-interrogation-prompt.server";
import { callModel } from "../src/lib/interrogation-model.server";
const rules = getLastTripRules("lt-jassim")!;
const { system, user } = buildLastTripPrompt(rules, { suspectId:"lt-jassim", message:"وين كنت وقتها؟", stress:20, unlockedEvidence:[], confrontHistory:[], contradictionCount:0, transcript:[] });
const r = await callModel({ system, user, profile:{ unlockTriggers: [] } });
console.log(JSON.stringify(r));
