// Single source of truth for every page. Content carried over from the
// previous portfolio (portio); only the presentation is new.

export const PROFILE = {
  name: "Biprodeep Bose",
  handle: "biprodeep",
  accountId: "bb-0412-2026",
  role: "Full-Stack Developer & DevOps Engineer",
  summary:
    "I architect scalable digital platforms and automated workflows. Currently exploring the intersection of precise software engineering and robust cloud infrastructure.",
  location: "Remote",
  site: "https://biprodeep.me",
  email: "bipbose123@gmail.com",
  github: "https://github.com/Biprodeep12",
  linkedin: "https://www.linkedin.com/in/biprodeep-bose/",
  instagram: "https://www.instagram.com/bosebd/",
  motto: "Go For It",
} as const;

export type Project = {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
  url: string;
  stack: string[];
  type: string;
  status: "Running" | "Stopped";
};

export const PROJECTS: Project[] = [
  {
    id: "strux",
    name: "STRUX",
    title: "Cloud Infrastructure, Simplified",
    description:
      "STRUX is a unified control layer for AWS that lets you launch, deploy, monitor, and automate infrastructure from one clean interface.",
    image: "/projectX.webp",
    url: "https://strux.biprodeep.me",
    stack: ["Next.js", "WebSockets", "AWS"],
    type: "Cloud platform",
    status: "Running",
  },
  {
    id: "mapgeox",
    name: "MapGeox",
    title: "Smart Transit",
    description:
      "A comprehensive bus tracking and route mapping platform allowing real-time navigation and intelligent booking.",
    image: "/project1.0x.webp",
    url: "https://mapgoex.vercel.app/Info",
    stack: ["Next.js", "WebSockets", "MongoDB"],
    type: "Web application",
    status: "Running",
  },
];

export type Role = {
  id: string;
  company: string;
  title: string;
  period: string;
  start: string;
  location: string;
  description: string;
  skills: string[];
  status: "Active" | "Completed";
};

export const EXPERIENCE: Role[] = [
  {
    id: "dep-saffronstays",
    company: "SaffronStays",
    title: "Software Development Engineer Intern",
    period: "Apr 2025 – Present",
    start: "2025-04",
    location: "Remote",
    description:
      "Designed end-to-end testing frameworks and engineered scalable search architectures. Integrated analytics to track user behavior, significantly improving both release reliability and SEO discoverability.",
    skills: ["Next.js", "TypeScript", "Testing"],
    status: "Active",
  },
  {
    id: "dep-cotr",
    company: "Coding On The Rocks",
    title: "Full-Stack Developer",
    period: "Dec 2025 – Present",
    start: "2025-12",
    location: "Remote",
    description:
      "Developed scalable applications with secure authentication and optimized REST APIs. Translated complex business requirements into maintainable, production-ready solutions using modern CI/CD pipelines.",
    skills: ["React", "Node.js", "REST APIs", "CI/CD"],
    status: "Active",
  },
];

export const SERVICES = [
  {
    id: "svc-frontend",
    name: "Frontend Architecture",
    description:
      "React & Next.js interfaces crafted with TypeScript. Reusable components, clean structure, and thoughtful UX built for growth. I value readability, scalability, and smooth engineering workflows across the stack.",
    tags: ["React", "Next.js", "TypeScript"],
  },
  {
    id: "svc-devops",
    name: "DevOps & Infrastructure",
    description:
      "Designing highly available backend architecture and automated cloud workflows. Experience setting up containerized services, automated CI/CD pipelines, and secure deployment infrastructure.",
    tags: ["Docker", "CI/CD Pipelines", "AWS/GCP", "Linux"],
  },
  {
    id: "svc-perf",
    name: "Performance Optimization",
    description:
      "Optimizing load times and interactivity. Smaller bundles, faster first paint, fewer re-renders. Aiming for responsive 60fps experiences that feel effortless.",
    tags: ["Bundles", "First paint", "60fps"],
  },
];

export const SKILLS: { group: string; prefix: string; items: string[] }[] = [
  { group: "Languages", prefix: "lang", items: ["TypeScript", "JavaScript", "Python", "C", "Go", "SQL"] },
  {
    group: "Technologies",
    prefix: "tech",
    items: ["React", "Next.js", "Node.js", "Express.js", "React Native", "AWS", "GraphQL", "Redis", "Linux"],
  },
  { group: "Databases", prefix: "db", items: ["MySQL", "PostgreSQL", "MongoDB", "Firebase"] },
  { group: "Tools & Platforms", prefix: "tool", items: ["Git", "Github", "Docker", "Vercel", "Figma"] },
];

export const ABOUT = {
  philosophy: "Coding is a journey of learning and improving daily.",
  background:
    "Coding is never finished—it's a journey of constant discovery. I build products with clear logic, solid architecture, and thoughtful design, driven by curiosity and a desire to learn every day.",
  outside:
    "When I'm away from code, I enjoy learning new tech, gaming with friends, exploring music, or reading about engineering ideas.",
  approach:
    "I believe great products balance usability, performance, and clarity. Code should be scalable and readable — built with purpose. Smooth experiences matter, and details shape how software feels.",
};

export const RESUME = { file: "/Resume.pdf", name: "Resume.pdf", sizeKb: 134 };

export const SECTIONS = [
  { id: "services", label: "Services", api: "ListServices" },
  { id: "projects", label: "Projects", api: "ListResources" },
  { id: "deployments", label: "Deployments", api: "DescribeDeployments" },
  { id: "capabilities", label: "Capabilities", api: "GetPolicy" },
  { id: "about", label: "Account", api: "GetAccount" },
  { id: "documents", label: "Documents", api: "ListObjects" },
  { id: "contact", label: "Support", api: "OpenSupportCenter" },
] as const;
