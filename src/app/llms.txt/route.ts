import { factSheet } from "@/data/knowledge";
import { NOTES } from "@/data/notes";
import { PROFILE, PROJECTS } from "@/data/profile";

// Plain-text profile for AI assistants and resume screeners (llmstxt.org format).
export const dynamic = "force-static";

export function GET() {
  const site = PROFILE.site;
  const body = `# ${PROFILE.name}

> ${PROFILE.role}. ${PROFILE.summary}

## Profile

${factSheet()}

## Pages

- [Home](${site}/): overview, projects, experience, skills, contact
- [Blueprint](${site}/blueprint/): learn system design through one interactive design for 1M monthly users (requirements, estimates, every layer, scaling, trade-offs, glossary)
- [Resume (PDF)](${site}/Resume.pdf)
${PROJECTS.map((p) => `- [${p.name}](${site}/projects/${p.id}/): ${p.title}`).join("\n")}

## Notes

${NOTES.map((n) => `- [${n.title}](${site}/notes/${n.slug}/): ${n.summary}`).join("\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
