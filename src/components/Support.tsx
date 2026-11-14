import { ArrowUpRight, FileText, Github, Instagram, Linkedin, Mail } from "lucide-react";
import { PROFILE } from "@/data/profile";
import { CopyButton } from "./client";

const CHANNELS = [
  { name: "Email", icon: Mail, value: PROFILE.email, href: `mailto:${PROFILE.email}`, copy: PROFILE.email, note: "Best for anything detailed" },
  { name: "LinkedIn", icon: Linkedin, value: "biprodeep-bose", href: PROFILE.linkedin, copy: PROFILE.linkedin, note: "Roles and referrals" },
  { name: "GitHub", icon: Github, value: "Biprodeep12", href: PROFILE.github, copy: PROFILE.github, note: "Code and projects" },
  { name: "Resume", icon: FileText, value: "Resume.pdf", href: "/Resume.pdf", copy: `${PROFILE.site}/Resume.pdf`, note: "One page, PDF" },
  { name: "Instagram", icon: Instagram, value: "@bosebd", href: PROFILE.instagram, copy: PROFILE.instagram, note: "The less formal side" },
];

const STEPS = [
  { title: "Pick a topic", body: "Job, freelance, collaboration, or just hello." },
  { title: "Write a few lines", body: "The draft is saved in your browser as you type." },
  { title: "Send", body: "Your own mail app opens with everything filled in. Nothing is stored on a server." },
];

/** Direct channels plus how the form works: the left column of the Support section. */
export function SupportChannels() {
  return (
    <div className="flex flex-col gap-6">
      <div className="panel overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 pb-3 label">Reach me directly</div>
        <ul className="divide-y divide-line border-t border-line">
          {CHANNELS.map((c, i) => {
            const Icon = c.icon;
            const external = !c.href.startsWith("mailto:") && !c.href.startsWith("/");
            return (
              <li key={c.name} className="flex items-center gap-3 px-5 sm:px-6 py-3.5 hover:bg-hover/60 transition-colors">
                <span className={`grid place-items-center size-9 rounded-md shrink-0 ${i === 0 ? "bg-accent-soft text-accent" : "bg-hover text-muted"}`}>
                  <Icon className="size-4" />
                </span>
                <a href={c.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="min-w-0 flex-1 group">
                  <span className="flex items-center gap-2">
                    <span className="text-[13.5px] font-medium text-fg group-hover:text-accent transition-colors truncate">{c.value}</span>
                    {external && <ArrowUpRight className="size-3 text-faint shrink-0" />}
                  </span>
                  <span className="block text-[12px] text-muted">
                    {c.name} · {c.note}
                  </span>
                </a>
                <CopyButton value={c.copy} label={`${c.name} copied`} />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="panel p-5 sm:p-6">
        <div className="label mb-4">How the form works</div>
        <ol className="flex flex-col gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="size-6 shrink-0 rounded-full bg-accent-soft text-accent grid place-items-center mono text-[11px] font-semibold">{i + 1}</span>
              <span>
                <span className="block text-[13.5px] font-medium text-fg">{s.title}</span>
                <span className="block text-[13px] text-muted leading-relaxed">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
