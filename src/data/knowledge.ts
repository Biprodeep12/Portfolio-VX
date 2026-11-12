// Everything the assistant knows, derived from profile.ts so it never drifts.
// Used two ways: as the fact sheet in the AI system prompt (server), and by the
// offline answer engine (browser) when the model is unavailable.

import { ABOUT, BUILDING_SINCE, EXPERIENCE, FIRST_ROLE, FIRST_ROLE_START, PROFILE, PROJECTS, RESUME, SECTIONS, SERVICES, SKILLS, durationSince, metricsFor } from "./profile";
import { evaluate } from "./policy";
import { FAQ } from "./faq";

export type ChatAction =
  | { kind: "project"; label: string; id: string }
  | { kind: "resume"; label: string }
  | { kind: "section"; label: string; id: string }
  | { kind: "copy"; label: string; value: string }
  | { kind: "link"; label: string; href: string };

export type LocalAnswer = { text: string; actions?: ChatAction[] };

export const SUGGESTIONS = [
  "What does Biprodeep work on?",
  "Tell me about STRUX",
  "Can he work with Docker?",
  "How do I contact him?",
];

/* ---------------- Fact sheet (for the model) ---------------- */

export function factSheet() {
  const lines: string[] = [];
  lines.push(`Name: ${PROFILE.name}`);
  lines.push(`Role: ${PROFILE.role}`);
  lines.push(`Summary: ${PROFILE.summary}`);
  lines.push(`Works: ${PROFILE.location}`);
  lines.push(
    `Experience: ${durationSince(FIRST_ROLE_START).label} professionally (since ${FIRST_ROLE}); building software for ${durationSince(BUILDING_SINCE.start).label} (first public project ${BUILDING_SINCE.label}).`,
  );
  lines.push(`Contact: email ${PROFILE.email}; GitHub ${PROFILE.github}; LinkedIn ${PROFILE.linkedin}; Instagram ${PROFILE.instagram}`);
  lines.push(`Resume: ${PROFILE.site}${RESUME.file}`);
  lines.push("");
  lines.push("Current roles:");
  EXPERIENCE.forEach((r) =>
    lines.push(
      `- ${r.title} at ${r.company} (${r.period}, ${r.location}): ${r.description} Stack: ${r.skills.join(", ")}.${metricsFor(r).length ? ` Measured: ${metricsFor(r).join(", ")}.` : ""}`,
    ),
  );
  lines.push("");
  lines.push("Projects:");
  PROJECTS.forEach((p) => lines.push(`- ${p.name} (${p.title}): ${p.description} Stack: ${p.stack.join(", ")}. Live at ${p.url}`));
  lines.push("");
  lines.push("Focus areas:");
  SERVICES.forEach((s) => lines.push(`- ${s.name}: ${s.description}`));
  lines.push("");
  lines.push("Skills:");
  SKILLS.forEach((g) => lines.push(`- ${g.group}: ${g.items.join(", ")}`));
  lines.push("");
  lines.push(`Philosophy: ${ABOUT.philosophy}`);
  lines.push(`Background: ${ABOUT.background}`);
  lines.push(`Approach: ${ABOUT.approach}`);
  lines.push(`Outside work: ${ABOUT.outside}`);
  lines.push("");
  lines.push("FAQ:");
  FAQ.forEach((f) => lines.push(`- Q: ${f.q} A: ${f.a}`));
  lines.push(`This website: a single-page portfolio styled like a cloud console, built with Next.js, React, TypeScript and Tailwind CSS.`);
  return lines.join("\n");
}

/* ---------------- Offline answer engine ---------------- */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9.+#/ ]+/g, " ").replace(/\s+/g, " ").trim();
const has = (q: string, words: string[]) => words.some((w) => new RegExp(`(^|\\b|\\s)${w}`, "i").test(q));

const contactActions: ChatAction[] = [
  { kind: "copy", label: "Copy email", value: PROFILE.email },
  { kind: "section", label: "Open contact form", id: "contact" },
  { kind: "link", label: "LinkedIn", href: PROFILE.linkedin },
];

function projectAnswer(id: string): LocalAnswer {
  const p = PROJECTS.find((x) => x.id === id)!;
  return {
    text: `**${p.name}** — ${p.title}. ${p.description}\n\nBuilt with ${p.stack.join(", ")}. It's live at ${p.url}`,
    actions: [
      { kind: "project", label: `Inspect ${p.name}`, id: p.id },
      { kind: "link", label: "Open live site", href: p.url },
    ],
  };
}

function roleAnswer(company: string): LocalAnswer {
  const r = EXPERIENCE.find((x) => x.company === company)!;
  return {
    text: `At **${r.company}** he's a ${r.title} (${r.period}, ${r.location.toLowerCase()}). ${r.description}\n\nStack there: ${r.skills.join(", ")}.`,
    actions: [{ kind: "section", label: "See deployments", id: "deployments" }],
  };
}

const INTENTS: { keys: string[]; answer: () => LocalAnswer }[] = [
  {
    keys: ["hi", "hello", "hey", "yo", "good morning", "good evening", "sup"],
    answer: () => ({
      text: `Hey! I'm the assistant on ${PROFILE.name}'s console. Ask me about his work, projects, stack or how to reach him.`,
    }),
  },
  {
    keys: ["contact", "reach", "email", "mail", "hire", "hiring", "get in touch", "talk to", "connect", "available", "availability", "freelance", "opportunit"],
    answer: () => ({
      text: `The fastest way is email: **${PROFILE.email}**. You can also use the contact form on this page or message him on LinkedIn. For availability or a specific role, just ask him directly.`,
      actions: contactActions,
    }),
  },
  {
    keys: ["resume", "cv", "curriculum"],
    answer: () => ({
      text: `His resume is a one-page PDF (${RESUME.sizeKb} KB). You can preview it here or download it.`,
      actions: [{ kind: "resume", label: "Open resume" }],
    }),
  },
  {
    keys: ["project", "built", "build", "portfolio", "work sample", "made", "side project", "app"],
    answer: () => ({
      text: `Two featured projects, both live:\n${PROJECTS.map((p) => `- **${p.name}** — ${p.title} (${p.stack.join(", ")})`).join("\n")}\n\nMore experiments are on GitHub.`,
      actions: [
        ...PROJECTS.map((p) => ({ kind: "project" as const, label: `Inspect ${p.name}`, id: p.id })),
        { kind: "link", label: "GitHub", href: PROFILE.github },
      ],
    }),
  },
  {
    keys: ["experience", "work", "job", "company", "companies", "employ", "career", "current", "intern", "role", "where does he work"],
    answer: () => ({
      text: `He currently holds two remote roles:\n${EXPERIENCE.map((r) => `- **${r.title}** at ${r.company} (${r.period})`).join("\n")}\n\nThat's ${durationSince(FIRST_ROLE_START).label} professionally; he's been building since ${BUILDING_SINCE.label} (${durationSince(BUILDING_SINCE.start).label}).`,
      actions: [{ kind: "section", label: "See deployments", id: "deployments" }],
    }),
  },
  {
    keys: ["skill", "stack", "tech", "language", "framework", "tools", "know", "database"],
    answer: () => ({
      text: SKILLS.map((g) => `- **${g.group}:** ${g.items.join(", ")}`).join("\n") + "\n\nAsk “can he work with X?” for anything specific.",
      actions: [{ kind: "section", label: "See the stack", id: "stack" }],
    }),
  },
  {
    keys: ["devops", "infra", "cloud", "ci/cd", "cicd", "pipeline", "deploy", "container"],
    answer: () => {
      const s = SERVICES[1];
      return { text: `**${s.name}** — ${s.description}\n\nTools: ${s.tags.join(", ")}.`, actions: [{ kind: "section", label: "See services", id: "services" }] };
    },
  },
  {
    keys: ["frontend", "front end", "ui", "react", "next"],
    answer: () => {
      const s = SERVICES[0];
      return { text: `**${s.name}** — ${s.description}`, actions: [{ kind: "section", label: "See services", id: "services" }] };
    },
  },
  {
    keys: ["performance", "speed", "fast", "optimi", "lighthouse"],
    answer: () => {
      const s = SERVICES[2];
      return { text: `**${s.name}** — ${s.description}`, actions: [{ kind: "section", label: "See services", id: "services" }] };
    },
  },
  {
    keys: ["who", "about", "yourself", "himself", "introduce", "biprodeep", "what does he do", "background", "summary"],
    answer: () => ({
      text: `**${PROFILE.name}** is a ${PROFILE.role}. ${PROFILE.summary}`,
      actions: [{ kind: "section", label: "About him", id: "about" }],
    }),
  },
  {
    keys: ["where", "location", "based", "remote", "country", "city", "timezone"],
    answer: () => ({
      text: `He works remotely — both current roles are remote. For anything location-specific, it's best to ask him directly at ${PROFILE.email}.`,
      actions: contactActions.slice(0, 1),
    }),
  },
  {
    keys: ["year", "how long", "senior", "junior", "level"],
    answer: () => ({
      text: `${durationSince(FIRST_ROLE_START).label} of professional experience (since ${FIRST_ROLE}), currently at ${EXPERIENCE.map((e) => e.company).join(" and ")}. He started building in ${BUILDING_SINCE.label}, ${durationSince(BUILDING_SINCE.start).label} ago.`,
    }),
  },
  {
    keys: ["educat", "degree", "college", "university", "study", "school"],
    answer: () => ({
      text: `Education details aren't listed on this site. The resume has the full picture, or you can ask him directly.`,
      actions: [{ kind: "resume", label: "Open resume" }, ...contactActions.slice(0, 1)],
    }),
  },
  {
    keys: ["hobb", "free time", "outside", "fun", "game", "music", "interest"],
    answer: () => ({ text: ABOUT.outside }),
  },
  {
    keys: ["philosoph", "approach", "believe", "value", "principle", "mindset"],
    answer: () => ({ text: `“${ABOUT.philosophy}” ${ABOUT.approach}` }),
  },
  {
    keys: ["github", "linkedin", "instagram", "social", "twitter"],
    answer: () => ({
      text: `GitHub: ${PROFILE.github}\nLinkedIn: ${PROFILE.linkedin}\nInstagram: ${PROFILE.instagram}`,
      actions: [
        { kind: "link", label: "GitHub", href: PROFILE.github },
        { kind: "link", label: "LinkedIn", href: PROFILE.linkedin },
      ],
    }),
  },
  {
    keys: ["this site", "this website", "website built", "how was this", "made this", "source"],
    answer: () => ({
      text: "This site is a single-page Next.js app styled like a cloud console: Tailwind CSS, a real in-page shell, and no tracking. Try `help` in the terminal at the top.",
    }),
  },
  { keys: ["thank", "thanks", "cheers", "great", "cool", "nice"], answer: () => ({ text: "Anytime! Anything else you'd like to know?" }) },
];

/** Answer a question from the portfolio data alone. Always returns something useful. */
export function localAnswer(question: string): LocalAnswer {
  const q = norm(question);

  // Specific entities beat generic intents.
  if (/\bstrux\b/.test(q)) return projectAnswer("strux");
  if (/\bmap ?ge?o?x\b|mapgoex|bus track|transit/.test(q)) return projectAnswer("mapgeox");
  if (/saffron/.test(q)) return roleAnswer("SaffronStays");
  if (/coding on the rocks|\bcotr\b/.test(q)) return roleAnswer("Coding On The Rocks");

  // "can he / does he know / experience with X"
  const cap = q.match(/(?:can (?:he|you|biprodeep)|does (?:he|biprodeep)|do you|is he|experience (?:with|in)|know(?:s)?|work(?:s)? with|use(?:s)?|familiar with)\s+(?:work with |use |know |do |code in |with |in )?([a-z0-9.+#/ -]{1,30})\??$/);
  if (cap) {
    const term = cap[1].replace(/\b(at all|well|too|also|really)\b/g, "").trim();
    const d = evaluate(term);
    if (d.effect === "Allow") {
      return {
        text: `Yes — **${d.skill}** is in his stack (policy action \`${d.action}\`).`,
        actions: [{ kind: "section", label: "See the stack", id: "stack" }],
      };
    }
    if (term && term.split(" ").length <= 3) {
      return {
        text: `**${term}** isn't listed in his stack on this site. He may still have used it, so it's worth asking him directly.`,
        actions: contactActions.slice(0, 2),
      };
    }
  }

  // FAQ entries win when their phrasing matches clearly.
  let faqBest = { score: 0, i: -1 };
  FAQ.forEach((f, i) => {
    const score = f.keys.reduce((n, k) => n + (has(q, [k]) ? k.length : 0), 0);
    if (score > faqBest.score) faqBest = { score, i };
  });
  if (faqBest.score >= 6) return { text: FAQ[faqBest.i].a, actions: [{ kind: "section", label: "See FAQ", id: "faq" }] };

  let best: { score: number; i: number } = { score: 0, i: -1 };
  INTENTS.forEach((intent, i) => {
    const score = intent.keys.reduce((n, k) => n + (has(q, [k]) ? k.length : 0), 0);
    if (score > best.score) best = { score, i };
  });
  if (best.i >= 0) return INTENTS[best.i].answer();

  return {
    text: `I'm not sure about that one. I can tell you about his projects, experience, stack, or how to reach him — or ask him directly at ${PROFILE.email}.`,
    actions: [{ kind: "section", label: "Projects", id: "projects" }, ...contactActions.slice(0, 1)],
  };
}

/** Actions worth showing under any answer, inferred from the question. */
export function actionsFor(question: string): ChatAction[] {
  return localAnswer(question).actions?.slice(0, 3) ?? [];
}

export const SECTION_IDS = SECTIONS.map((s) => s.id);

/* ---------------- Thinking trace topics ---------------- */

const TOPIC_KEYS: [string, string[]][] = [
  ["projects", ["project", "strux", "mapgeox", "mapgoex", "built", "build", "app", "demo", "portfolio"]],
  ["experience", ["work", "job", "role", "experience", "saffron", "coding on the rocks", "career", "company", "year"]],
  ["stack", ["skill", "stack", "tech", "language", "framework", "can he", "does he", "know", "use", "docker", "aws", "react", "next", "go", "python", "database"]],
  ["contact", ["contact", "hire", "email", "reach", "available", "availability", "freelance", "resume", "cv"]],
  ["about", ["who", "about", "background", "hobby", "free time", "philosophy", "approach", "location", "where"]],
  ["notes", ["note", "blog", "write", "performance", "lighthouse", "adr", "lcp"]],
];

/** Which parts of the portfolio a question touches; drives the chat's thinking trace. */
export function topicsFor(question: string): string[] {
  const q = question.toLowerCase();
  const hits = TOPIC_KEYS.filter(([, keys]) => keys.some((k) => q.includes(k))).map(([t]) => t);
  return hits.length ? hits.slice(0, 3) : ["profile"];
}
