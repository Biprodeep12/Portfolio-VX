import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Shell } from "@/components/Shell";
import { EXPERIENCE, PROFILE, PROJECTS, SKILLS } from "@/data/profile";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jbm = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbm", display: "swap", preload: false });

const title = `${PROFILE.name} | ${PROFILE.role}`;
const description =
  "Biprodeep Bose is a full-stack developer and DevOps engineer building Next.js, React and Node.js products on AWS, with CI/CD, containers and performance work. Projects, experience and contact.";
const OG = { url: "/og.jpg", width: 1200, height: 630, alt: `${PROFILE.name}, ${PROFILE.role}` };

export const metadata: Metadata = {
  metadataBase: new URL(PROFILE.site),
  title: { default: title, template: `%s · ${PROFILE.name}` },
  description,
  applicationName: `${PROFILE.name} Console`,
  keywords: [
    "Biprodeep Bose",
    "Biprodeep",
    "full-stack developer",
    "DevOps engineer",
    "Next.js developer",
    "React developer",
    "Node.js",
    "AWS",
    "CI/CD",
    "portfolio",
  ],
  authors: [{ name: PROFILE.name, url: PROFILE.site }],
  creator: PROFILE.name,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: { type: "profile", firstName: "Biprodeep", lastName: "Bose", url: "/", title, description, siteName: PROFILE.name, locale: "en_US", images: [OG] },
  twitter: { card: "summary_large_image", title, description, creator: "@BiprodeepBose", images: [OG] },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }, { url: "/favicon.ico", sizes: "any" }],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  other: { "format-detection": "telephone=no" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#12151a" },
  ],
};

// Runs before paint so the saved / system theme never flashes.
const themeScript = `document.documentElement.classList.add("js");try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

const SITE = PROFILE.site;
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: `${SITE}/`,
      name: PROFILE.name,
      inLanguage: "en",
      publisher: { "@id": `${SITE}/#person` },
    },
    {
      "@type": "ProfilePage",
      "@id": `${SITE}/#profile`,
      url: `${SITE}/`,
      name: title,
      description,
      isPartOf: { "@id": `${SITE}/#website` },
      mainEntity: { "@id": `${SITE}/#person` },
      primaryImageOfPage: `${SITE}${OG.url}`,
    },
    {
      "@type": "Person",
      "@id": `${SITE}/#person`,
      name: PROFILE.name,
      givenName: "Biprodeep",
      familyName: "Bose",
      url: `${SITE}/`,
      image: `${SITE}/img/pfp-640.webp`,
      email: `mailto:${PROFILE.email}`,
      jobTitle: PROFILE.role,
      description: PROFILE.summary,
      worksFor: EXPERIENCE.map((r) => ({ "@type": "Organization", name: r.company })),
      sameAs: [PROFILE.github, PROFILE.linkedin, PROFILE.instagram],
      knowsAbout: [...new Set(SKILLS.flatMap((g) => g.items))],
    },
    ...PROJECTS.map((p) => ({
      "@type": "SoftwareApplication",
      "@id": `${SITE}/#${p.id}`,
      name: p.name,
      alternateName: p.title,
      description: p.description,
      url: p.url,
      image: `${SITE}/img/${p.image.slice(1).replace(".webp", "")}-1080.webp`,
      applicationCategory: "WebApplication",
      operatingSystem: "Web",
      author: { "@id": `${SITE}/#person` },
      keywords: p.stack.join(", "),
    })),
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jbm.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] btn-primary">
          Skip to content
        </a>
        <div className="scroll-progress" aria-hidden />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
