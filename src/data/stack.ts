// The Stack section: every technology placed in an architecture
// layer, with evidence of where it has actually shipped. Evidence comes from
// the projects' code and the work repos' dependency manifests (package.json,
// go.mod, requirements.txt, CI workflows). A skill with no `used` entries is
// listed from the profile but not yet shown in shipped work here.

export type PlaceId = "strux" | "mapgeox" | "saffronstays" | "cotr";

export const PLACES: { id: PlaceId; name: string; kind: "project" | "role"; href: string }[] = [
  { id: "strux", name: "STRUX", kind: "project", href: "/projects/strux/" },
  { id: "mapgeox", name: "MapGeox", kind: "project", href: "/projects/mapgeox/" },
  { id: "saffronstays", name: "SaffronStays", kind: "role", href: "/#deployments" },
  { id: "cotr", name: "Coding On The Rocks", kind: "role", href: "/#deployments" },
];

export type StackSkill = { name: string; used: PlaceId[]; note?: string };
export type Layer = { id: string; name: string; caption: string; skills: StackSkill[] };

const ALL: PlaceId[] = ["strux", "mapgeox", "saffronstays", "cotr"];

export const LAYERS: Layer[] = [
  {
    id: "client",
    name: "Client",
    caption: "What users touch",
    skills: [
      { name: "React", used: ALL },
      { name: "Next.js", used: ALL },
      { name: "React Native", used: ["cotr"], note: "Expo app shipped to Google Play" },
      { name: "TypeScript", used: ALL },
      { name: "JavaScript", used: ["mapgeox", "saffronstays"] },
      { name: "Tailwind CSS", used: ["strux", "saffronstays", "cotr"] },
    ],
  },
  {
    id: "api",
    name: "API & real-time",
    caption: "How clients talk to services",
    skills: [
      { name: "REST APIs", used: ALL },
      { name: "WebSockets", used: ["strux", "mapgeox"], note: "live command output, live bus positions" },
      { name: "Socket.IO", used: ["mapgeox", "cotr"] },
      { name: "LiveKit", used: ["cotr"], note: "audio & video" },
      { name: "GraphQL", used: [] },
    ],
  },
  {
    id: "services",
    name: "Services",
    caption: "Where the logic runs",
    skills: [
      { name: "Node.js", used: ALL },
      { name: "Express.js", used: ["mapgeox", "saffronstays", "cotr"] },
      { name: "NestJS", used: ["cotr"] },
      { name: "Go", used: ["saffronstays"], note: "Gin + GORM services" },
      { name: "Python", used: ["saffronstays"], note: "APIs and scheduled jobs" },
    ],
  },
  {
    id: "data",
    name: "Data",
    caption: "Where state lives",
    skills: [
      { name: "MongoDB", used: ALL },
      { name: "MySQL", used: ["saffronstays"] },
      { name: "Elasticsearch", used: ["saffronstays"], note: "search" },
      { name: "Firebase", used: ["strux", "mapgeox", "cotr"] },
      { name: "Redis", used: ["mapgeox"], note: "API cache" },
      { name: "PostgreSQL", used: [] },
    ],
  },
  {
    id: "infra",
    name: "Infra & delivery",
    caption: "How it ships and stays up",
    skills: [
      { name: "AWS", used: ["strux", "saffronstays"] },
      { name: "Docker", used: ["mapgeox", "saffronstays", "cotr"] },
      { name: "CI/CD", used: ["saffronstays"], note: "GitHub Actions deploys" },
      { name: "Linux", used: ["strux"] },
      { name: "Nginx", used: ["strux"], note: "per-tenant HTTPS" },
      { name: "Vercel", used: ["mapgeox"] },
    ],
  },
  {
    id: "quality",
    name: "Quality & tooling",
    caption: "How it stays correct",
    skills: [
      { name: "Playwright", used: ["saffronstays"], note: "end-to-end tests in CI" },
      { name: "Jest", used: ["cotr"] },
      { name: "Git & GitHub", used: ALL },
      { name: "Figma", used: [] },
    ],
  },
];

export const STACK_COUNT = LAYERS.reduce((n, l) => n + l.skills.length, 0);
export const placeById = (id: PlaceId) => PLACES.find((p) => p.id === id)!;
