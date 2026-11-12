import type { Metadata } from "next";
import { NOTES } from "@/data/notes";
import { PROFILE } from "@/data/profile";
import { Crumbs, Frame } from "@/components/Frame";
import { NoteList } from "@/components/NoteList";

export const metadata: Metadata = {
  title: "Notes",
  description: `Engineering write-ups and architecture decision records by ${PROFILE.name}.`,
  alternates: { canonical: "/notes/" },
};

export default function NotesIndex() {
  return (
    <Frame>
      <Crumbs items={[{ label: PROFILE.handle, href: "/" }, { label: "notes" }]} />
      <header className="mt-6 mb-8 anim-in">
        <h1 className="text-[34px] sm:text-[44px] leading-none font-semibold tracking-[-0.03em]">Notes</h1>
        <p className="mt-3 text-muted max-w-xl text-[14px] leading-relaxed">
          Short write-ups on how things were built and why. Decisions, numbers, and what I&apos;d change.
        </p>
      </header>
      <NoteList notes={NOTES} headingLevel={2} />
    </Frame>
  );
}
