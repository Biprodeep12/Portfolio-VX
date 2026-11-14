// FAQ: answers grounded in shipped work (work repos, STRUX, MapGeox, Strux,
// this site). Deliberately leaves out availability/relocation/salary, which
// only Biprodeep can answer. `keys` feed the assistant's offline engine.

import { BUILDING_SINCE, EXPERIENCE } from "./profile";

export type Faq = { q: string; a: string; keys: string[] };

const since = (period: string) => period.split(" – ")[0];
const rolesNow = EXPERIENCE.map(
  (r) =>
    `${r.title} at ${r.company} since ${since(r.period)}` +
    (r.mergedPRs ? ` (${r.mergedPRs} merged PRs across ${r.repos} repositories${r.scope ? `: ${r.scope}` : ""})` : ""),
).join(" and ");

export const FAQ: Faq[] = [
  {
    q: "What kind of work does Biprodeep do?",
    a: "He builds product features end to end: React and Next.js front ends, Go, Node.js and Python services behind them, a React Native app, and the AWS infrastructure and pipelines that ship it all. Most weeks that means moving between several codebases at once.",
    keys: ["what kind", "what does he do", "kind of work", "specialize", "specialise", "end to end"],
  },
  {
    q: "What is he working on right now?",
    a: `${EXPERIENCE.length === 2 ? "Two" : EXPERIENCE.length} remote roles in parallel: ${rolesNow}.`,
    keys: ["right now", "currently", "working on", "these days"],
  },
  {
    q: "Has he shipped mobile apps?",
    a: "Yes. At Coding On The Rocks he builds a React Native (Expo) app through to Google Play releases, including push notifications and in-app update prompts, alongside the web and backend changes those features need.",
    keys: ["mobile", "react native", "android", "play store", "ios", "app store"],
  },
  {
    q: "Does he handle DevOps and infrastructure?",
    a: "Yes: Linux servers on AWS, Docker and PM2 deployments, Nginx with HTTPS, CI/CD and routine patching. His own project STRUX automates most of that for other developers, from VPC setup to deploys, cron jobs and metrics.",
    keys: ["devops", "infrastructure", "aws", "docker", "deploy", "server", "ci/cd", "cicd", "linux"],
  },
  {
    q: "Has he built real-time features?",
    a: "Yes: Socket.IO chat services and LiveKit audio/video at Coding On The Rocks, live bus positions and ETAs in MapGeox, and live command output in STRUX.",
    keys: ["real-time", "realtime", "real time", "websocket", "socket", "live", "chat"],
  },
  {
    q: "Does he work with AI?",
    a: "Practically, yes: an AI assistant inside STRUX, a route assistant in MapGeox that answers from live data via tool calls, the assistant on this site (with an offline fallback), and a separate local-only desktop assistant (not the STRUX cloud platform).",
    keys: ["ai", "llm", "machine learning", "gpt", "assistant", "openrouter"],
  },
  {
    q: "How does he approach performance?",
    a: "Measure first, then fix the biggest cost. This site went from a 7.2 s to a 1.4 s mobile LCP by cutting render-blocking work and oversized images.",
    keys: ["performance", "speed", "fast", "lighthouse", "optimi"],
  },
  {
    q: "Where can I see his code?",
    a: `On GitHub, going back to his first public project in ${BUILDING_SINCE.label}: from early JavaScript experiments to STRUX and MapGeox. Work code for employers is private.`,
    keys: ["code", "github", "repo", "source", "open source", "portfolio"],
  },
  {
    q: "How do I reach him about a role or project?",
    a: "Email bipbose123@gmail.com or use the form on this page; for anything specific, like availability, ask him directly.",
    keys: ["reach", "contact", "hire", "role", "available", "availability", "freelance", "email"],
  },
];
