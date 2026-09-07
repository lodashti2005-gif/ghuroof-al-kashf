/**
 * English dictionary — natural English, not a literal word-for-word translation.
 * Keys must mirror `ar.ts`.
 */
export const en = {
  lang: {
    choose: "Choose your language",
    chooseHint: "You can switch anytime in settings.",
    arabic: "العربية",
    english: "English",
    label: "Language",
    continue: "Start",
  },
  common: {
    home: "Home",
    cases: "Cases",
    signIn: "Sign in",
    signOut: "Sign out",
    signingOut: "Signing out...",
    myPurchases: "My purchases",
    ownerPanel: "Owner panel",
    loading: "Loading...",
    back: "Back",
    settings: "Settings",
  },
  site: {
    tagline: "A co-op detective game",
    heroSub: "Not everyone tells the truth — your job is to find out what really happened.",
    playerGuide: "Player guide",
    howToPlay: "How to play",
    noticeTitle: "Heads up",
    noticeBody: "This game rewards observation and connecting evidence. Don't rush the accusation.",
    ctaChooseCase: "Got it — pick a case",
    statCases: "Cases available",
    statCasesValue: "{{count}} cases",
    statPlayers: "Players",
    statPlayersValue: "2 to 6 players",
    statDuration: "Session length",
    statDurationValue: "40 – 60 minutes",
    heroAlt: "A dim interrogation room",
    rights: "All rights reserved.",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    refund: "Refund Policy",
    contact: "Contact Us",
  },
  steps: {
    "1": { title: "Pick a case", body: ["Choose the case your team wants to investigate."] },
    "2": {
      title: "Get your friends in",
      body: ["It's a team game — everyone joins the same room."],
    },
    "3": {
      title: "Everyone gets a role",
      body: ["Each player gets a different role and ability that helps the investigation."],
    },
    "4": {
      title: "Search the crime scene",
      body: [
        "Move through the location yourself.",
        "Tap objects in the scene and explore every corner.",
        "Not every clue is obvious — there's no ready-made evidence list.",
      ],
    },
    "5": {
      title: "Collect the evidence",
      body: ["Every clue you find is added to the team's case file."],
    },
    "6": {
      title: "Interrogate the suspects",
      body: [
        "Every suspect has their own story and their own secrets.",
        "Ask questions, watch for contradictions, and press them with the right evidence.",
      ],
    },
    "7": {
      title: "Watch the clock",
      body: ["Each suspect has limited interrogation time.", "Plan your questions and don't waste it."],
    },
    "8": {
      title: "Work together",
      body: ["No single player can do everything.", "Use each other's roles and connect what you know."],
    },
    "9": {
      title: "The final accusation",
      body: ["When the investigation ends, name the person you believe is responsible."],
    },
    "10": {
      title: "Uncover the truth",
      body: [
        "Get it right and the full case reveal plays out.",
        "Get it wrong and you can re-accuse or watch the ending.",
      ],
    },
  },
  store: {
    eyebrow: "Case store",
    title: "Cases",
    note: "Only one player buys the case and opens the room — the rest join with the room code for free.",
    allCases: "All cases",
    myCases: "My cases",
    empty: "You don't own any cases yet. Buy one and it shows up here.",
    trialBadge: "10-minute trial",
    purchased: "Purchased ✓",
    startCase: "Start case",
    buyCase: "Buy case",
    startPlay: "Start playing",
    continuePlay: "Continue playing",
    soon: "Coming soon",
    price: "Price",
    difficulty: "Difficulty",
    players: "Players",
    playTime: "Play time",
    suspects: "Suspects",
  },
  trial: {
    over: "Your free trial has ended",
    overHint: "Buy the case and pick the investigation up right where you left off",
    buyAndContinue: "Buy the case and keep playing",
    backToCases: "Back to cases",
    remaining: "Trial time left",
  },
} as const;
