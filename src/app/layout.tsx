import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Shell } from "@/components/Shell";
import { PROFILE } from "@/data/profile";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jbm = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbm", display: "swap" });

const title = `${PROFILE.name} | ${PROFILE.role}`;
const description = `Portfolio of ${PROFILE.name}, a ${PROFILE.role} crafting scalable architectures and automated workflows.`;

export const metadata: Metadata = {
  metadataBase: new URL(PROFILE.site),
  title: { default: title, template: `%s · ${PROFILE.name}` },
  description,
  keywords: ["Biprodeep Bose", "Developer", "Full-Stack", "DevOps Engineer", "Next.js", "React", "Node.js", "AWS", "CI/CD"],
  authors: [{ name: PROFILE.name }],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", title, description, siteName: PROFILE.name, images: ["/seoImage.jpg"] },
  twitter: { card: "summary_large_image", title, description, creator: "@BiprodeepBose", images: ["/seoImage.jpg"] },
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#12151a" },
  ],
};

// Runs before paint so the saved / system theme never flashes.
const themeScript = `document.documentElement.classList.add("js");try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PROFILE.name,
  url: PROFILE.site,
  image: `${PROFILE.site}/seoImage.jpg`,
  sameAs: [PROFILE.github, PROFILE.linkedin],
  jobTitle: PROFILE.role,
  knowsAbout: ["Web Development", "Next.js", "React", "TypeScript", "Node.js", "System Design", "DevOps"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jbm.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
