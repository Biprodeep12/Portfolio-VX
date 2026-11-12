import { ArrowUpRight, Github, Instagram, Linkedin, Mail } from "lucide-react";
import { ABOUT, EXPERIENCE, PROFILE, PROJECTS, SERVICES, SKILLS } from "@/data/profile";
import { slug } from "@/data/policy";
import { Chips, Section, Status } from "@/components/ui";
import { CopyButton, CopyField, JsonBlock, Tabs } from "@/components/client";
import { ConsoleBar } from "@/components/Shell";
import { DocumentsTable, ProjectsView, ResumeButton } from "@/components/Details";
import { CaseForm } from "@/components/CaseForm";
import { Terminal } from "@/components/Terminal";
import { CountUp, DeploymentTimeline, HalftonePortrait, PolicySimulator, SessionMeter } from "@/components/Widgets";

// Evaluated at build time: the footer shows when this copy was deployed.
const BUILT_AT = new Date().toISOString();
const capabilityCount = SKILLS.reduce((n, g) => n + g.items.length, 0);
const SERVICE_PATHS = ["svc/frontend", "svc/infra", "svc/perf"];

const CHANNELS = [
  { name: "Email", icon: Mail, value: PROFILE.email, href: `mailto:${PROFILE.email}`, copy: PROFILE.email },
  { name: "GitHub", icon: Github, value: "Biprodeep12", href: PROFILE.github, copy: PROFILE.github },
  { name: "LinkedIn", icon: Linkedin, value: "biprodeep-bose", href: PROFILE.linkedin, copy: PROFILE.linkedin },
  { name: "Instagram", icon: Instagram, value: "@bosebd", href: PROFILE.instagram, copy: PROFILE.instagram },
];

export default function Home() {
  const policy = {
    Version: "2026-11-12",
    Principal: PROFILE.accountId,
    Statement: SKILLS.map((g) => ({
      Sid: g.group.replace(/[^A-Za-z]/g, ""),
      Effect: "Allow",
      Action: g.items.map((s) => `${g.prefix}:${slug(s)}`),
    })),
  };
  const built = new Date(BUILT_AT);

  return (
    <div className="relative overflow-x-clip">
      <div className="grid-bg absolute inset-x-0 top-0 h-[620px] pointer-events-none" aria-hidden />

      <div className="relative mx-auto max-w-[1160px] px-5 sm:px-8">
        <ConsoleBar />

        {/* Hero */}
        <header className="pt-10 sm:pt-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] gap-10 lg:gap-14 items-center">
          <div>
            <div className="hero-in flex items-center gap-1 mb-6 mono text-[11.5px] text-muted min-w-0">
              <span className="truncate">
                arn:bb:iam::0412:user/<span className="text-fg-2">{PROFILE.handle}</span>
              </span>
              <CopyButton value={`arn:bb:iam::0412:user/${PROFILE.handle}`} label="ARN copied" />
            </div>
            <h1 className="text-[44px] sm:text-[60px] leading-[0.98] font-semibold tracking-[-0.04em] text-fg">
              Biprodeep
              <br />
              Bose<span className="text-accent">.</span>
            </h1>
            <p className="mt-5 text-[16px] sm:text-[17px] font-medium text-fg-2 tracking-tight">{PROFILE.role}</p>
            <p className="mt-2.5 text-[14px] leading-relaxed text-muted max-w-[460px]">{PROFILE.summary}</p>
            <div style={{ ["--d" as string]: "380ms" }} className="hero-in mt-7 flex items-center gap-2 flex-wrap">
              <a href="#contact" className="btn-primary">
                Get in touch
              </a>
              <ResumeButton />
              <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="btn-icon border border-line-strong" aria-label="GitHub">
                <Github className="size-4" />
              </a>
              <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="btn-icon border border-line-strong" aria-label="LinkedIn">
                <Linkedin className="size-4" />
              </a>
            </div>
            <p style={{ ["--d" as string]: "560ms" }} className="hero-in mt-8 text-[12px] text-muted hidden lg:block">
              <span className="mono text-faint">→</span> The shell is real. Try <span className="mono text-fg-2">open strux</span> or{" "}
              <span className="mono text-fg-2">can docker</span>.
            </p>
          </div>

          <div className="hero-in" style={{ ["--d" as string]: "240ms" }}>
            <Terminal />
          </div>
        </header>

        {/* Metric strip */}
        <div data-reveal className="mt-14 panel grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
          <div className="px-5 py-4">
            <div className="label">Experience</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">2+</span>
              <span className="text-muted">yrs</span>
            </div>
            <div className="mt-1.5 text-[12px] text-muted">Shipping to production</div>
          </div>
          <div className="px-5 py-4 border-l border-line">
            <div className="label">Active deployments</div>
            <div className="mt-2 text-[28px] leading-none font-semibold tracking-tight tabular-nums">
              <CountUp value={EXPERIENCE.length} />
            </div>
            <div className="mt-1.5 text-[12px] text-muted">{EXPERIENCE.map((e) => e.company).join(" · ")}</div>
          </div>
          <div className="px-5 py-4 border-t lg:border-t-0 lg:border-l border-line">
            <div className="label">Resources serving</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">
                <CountUp value={PROJECTS.length} />
              </span>
              <span className="flex gap-1">
                {PROJECTS.map((p) => (
                  <span key={p.id} className="size-2.5 rounded-[3px] bg-ok/80" title={p.name} />
                ))}
              </span>
            </div>
            <div className="mt-1.5 text-[12px] text-muted">Both answering requests</div>
          </div>
          <div className="px-5 py-4 border-t border-l lg:border-t-0 border-line">
            <div className="label">Capabilities</div>
            <div className="mt-2 text-[28px] leading-none font-semibold tracking-tight tabular-nums">
              <CountUp value={capabilityCount} />
            </div>
            <div className="mt-2.5 flex h-1.5 rounded-full overflow-hidden gap-px" aria-label="Capabilities by group">
              {SKILLS.map((g, i) => (
                <span
                  key={g.group}
                  title={`${g.group}: ${g.items.length}`}
                  style={{ flex: g.items.length, opacity: 1 - i * 0.2 }}
                  className="bg-fg"
                />
              ))}
            </div>
          </div>
        </div>

        {/* 01 Services */}
        <Section
          id="services"
          index="01"
          title="Services"
          description="The three things I get called in for."
          actions={<span className="text-[12px] text-muted">3 of 3 healthy</span>}
        >
          <div className="panel divide-y divide-line overflow-hidden">
            {SERVICES.map((s, i) => (
              <article key={s.id} style={{ ["--d" as string]: `${i * 90}ms` }} className="rise grid grid-cols-1 md:grid-cols-[170px_minmax(0,1fr)_230px] gap-2 md:gap-8 px-5 py-5 hover:bg-hover/60 transition-colors">
                <div className="mono text-[12px] text-muted pt-0.5">
                  <span className="text-faint">0{i + 1} </span>
                  {SERVICE_PATHS[i]}
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] tracking-tight text-fg mb-1">{s.name}</h3>
                  <p className="text-muted leading-relaxed max-w-[560px]">{s.description}</p>
                </div>
                <div className="md:pt-0.5">
                  <Chips items={s.tags} />
                </div>
              </article>
            ))}
          </div>
        </Section>

        {/* 02 Projects */}
        <Section
          id="projects"
          index="02"
          title="Projects"
          description="Built by me, still serving traffic. Open one to look inside."
          actions={
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="btn h-7 px-2.5">
              Archive on GitHub <ArrowUpRight className="size-3.5" />
            </a>
          }
        >
          <ProjectsView />
        </Section>

        {/* 03 Deployments */}
        <Section id="deployments" index="03" title="Deployments" description="Where I'm shipping right now. Both live, both remote.">
          <div className="panel overflow-hidden">
            <DeploymentTimeline builtAt={BUILT_AT} />
            <div className="grid grid-cols-1 md:grid-cols-2 border-t border-line divide-y md:divide-y-0 md:divide-x divide-line">
              {[...EXPERIENCE]
                .sort((a, b) => b.start.localeCompare(a.start))
                .map((r, i) => (
                  <article key={r.id} style={{ ["--d" as string]: `${500 + i * 120}ms` }} className="rise p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[14px] text-fg">{r.title}</h3>
                        <div className="text-fg-2">
                          {r.company} <span className="text-faint">·</span> <span className="text-muted">{r.period}</span>
                        </div>
                      </div>
                      <Status>{r.status}</Status>
                    </div>
                    <p className="mt-3 text-muted leading-relaxed">{r.description}</p>
                    <div className="mt-3">
                      <Chips items={r.skills} />
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </Section>

        {/* 04 Capabilities */}
        <Section id="capabilities" index="04" title="Capabilities" description="The stack I work in. Ask the policy about anything.">
          <div className="panel overflow-hidden mb-4">
            <PolicySimulator />
          </div>
          <Tabs
            tabs={[
              {
                id: "matrix",
                label: "Statements",
                content: (
                  <div className="panel divide-y divide-line overflow-hidden">
                    {SKILLS.map((g, i) => (
                      <div key={g.group} style={{ ["--d" as string]: `${i * 70}ms` }} className="rise grid grid-cols-1 sm:grid-cols-[190px_minmax(0,1fr)_auto] gap-2 sm:gap-6 px-5 py-3.5 sm:items-center">
                        <div>
                          <div className="font-medium text-fg">{g.group}</div>
                          <div className="mono text-[11px] text-muted">{g.prefix}:*</div>
                        </div>
                        <Chips items={g.items} />
                        <span className="hidden sm:inline mono text-[11px] text-ok">Allow ×{g.items.length}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                id: "policy",
                label: "policy.json",
                content: <JsonBlock data={policy} filename="capabilities.policy.json" />,
              },
            ]}
          />
        </Section>

        {/* 05 Account */}
        <Section id="about" index="05" title="Account" description="The human behind the account ID.">
          <div className="panel overflow-hidden grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
            <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[380px] border-b md:border-b-0 md:border-r border-line bg-subtle">
              <HalftonePortrait src="/img/pfp-320.webp" full="/img/pfp-640.webp" alt={PROFILE.name} />
              <span className="absolute left-3 bottom-3 mono text-[10.5px] text-muted bg-panel/90 border border-line rounded px-1.5 py-0.5 pointer-events-none">
                hover to de-dither
              </span>
            </div>
            <div className="flex flex-col">
              <div className="px-6 py-6 border-b border-line">
                <div className="label mb-2">Philosophy</div>
                <p className="text-[20px] sm:text-[22px] leading-snug font-medium tracking-tight text-fg max-w-[560px]">
                  “{ABOUT.philosophy}”
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-line flex-1">
                {[
                  { k: "Background", v: ABOUT.background },
                  { k: "Approach", v: ABOUT.approach },
                  { k: "Off the clock", v: ABOUT.outside },
                ].map((r) => (
                  <div key={r.k} className="px-6 py-5">
                    <div className="label mb-2">{r.k}</div>
                    <p className="text-fg-2 leading-relaxed">{r.v}</p>
                  </div>
                ))}
              </div>
              <dl className="grid grid-cols-2 lg:grid-cols-4 border-t border-line bg-subtle/60">
                {[
                  { k: "Account ID", v: <CopyField value={PROFILE.accountId} /> },
                  { k: "Region", v: PROFILE.location },
                  { k: "Username", v: <span className="mono">{PROFILE.handle}</span> },
                  {
                    k: "Website",
                    v: (
                      <a className="link" href={PROFILE.site}>
                        {new URL(PROFILE.site).host}
                      </a>
                    ),
                  },
                ].map((r, i) => (
                  <div key={r.k} className={`px-6 py-3 border-line ${i % 2 ? "border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
                    <dt className="label mb-0.5">{r.k}</dt>
                    <dd className="text-fg min-h-6 flex items-center">{r.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Section>

        {/* 06 Documents */}
        <Section id="documents" index="06" title="Documents" description="One file. You know the one.">
          <DocumentsTable />
        </Section>

        {/* 07 Support */}
        <Section id="contact" index="07" title="Support" description="Opportunities, side projects, or just a hello.">
          <CaseForm />
          <div className="mt-4 panel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden">
            {CHANNELS.map((c, i) => {
              const Icon = c.icon;
              const external = !c.href.startsWith("mailto:");
              return (
                <div
                  key={c.name}
                  className={`flex items-center gap-3 px-4 h-16 hover:bg-hover transition-colors border-line ${i > 0 ? "border-t sm:border-t-0" : ""} ${
                    i % 2 ? "sm:border-l" : ""
                  } ${i >= 2 ? "sm:border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
                >
                  <Icon className="size-4 text-muted shrink-0" />
                  <a href={c.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="min-w-0 flex-1 group">
                    <span className="block text-[11.5px] text-muted leading-4">{c.name}</span>
                    <span className="block text-fg group-hover:text-accent truncate transition-colors">{c.value}</span>
                  </a>
                  <CopyButton value={c.copy} label={`${c.name} copied`} />
                </div>
              );
            })}
          </div>
        </Section>

        <footer className="mt-20 mb-10 pt-5 border-t border-line grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px] text-muted">
          <span>
            © {built.getFullYear()} {PROFILE.name} ·{" "}
            <span className="mono" title={BUILT_AT}>
              deployed {built.toISOString().slice(0, 10)}
            </span>
          </span>
          <span className="md:text-center">
            <SessionMeter />
          </span>
          <span className="md:text-right uppercase tracking-[0.18em] text-faint">{PROFILE.motto}</span>
        </footer>
      </div>
    </div>
  );
}
