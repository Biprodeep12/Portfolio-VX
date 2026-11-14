import type { MetadataRoute } from "next";
import { PROFILE, PROJECTS } from "@/data/profile";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = PROFILE.site;
  return [
    { url: `${site}/`, changeFrequency: "monthly", priority: 1 },
    ...PROJECTS.map((p) => ({ url: `${site}/projects/${p.id}/`, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${site}/blueprint/`, changeFrequency: "monthly", priority: 0.9 },
  ];
}
