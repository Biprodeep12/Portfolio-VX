// Real quotes only, with the person's permission. The References block on the
// home page stays hidden until this list has entries.
//
// Example shape:
// { quote: "…", name: "Full Name", role: "Engineering Manager", company: "SaffronStays", link: "https://www.linkedin.com/in/…" }

export type Testimonial = { quote: string; name: string; role: string; company: string; link?: string };

export const TESTIMONIALS: Testimonial[] = [];
