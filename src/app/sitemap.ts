import type { MetadataRoute } from "next";
import { NOTES } from "@/data/notes";
import { PROFILE, PROJECTS } from "@/data/profile";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = PROFILE.site;
  const latestNote = NOTES.map((n) => n.date).sort().pop();
  return [
    { url: `${site}/`, changeFrequency: "monthly", priority: 1 },
    ...PROJECTS.map((p) => ({ url: `${site}/projects/${p.id}/`, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${site}/notes/`, lastModified: latestNote, changeFrequency: "monthly", priority: 0.6 },
    ...NOTES.map((n) => ({ url: `${site}/notes/${n.slug}/`, lastModified: n.date, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
