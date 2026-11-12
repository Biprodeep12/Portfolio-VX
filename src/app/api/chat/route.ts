import { factSheet } from "@/data/knowledge";
import { PROFILE } from "@/data/profile";

// Portfolio assistant: proxies to OpenRouter so the key never reaches the
// browser, and streams plain text back. Any failure returns a non-2xx and the
// client falls back to its offline answer engine.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

const MAX_TURNS = 10;
const MAX_CHARS = 600;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;

const SYSTEM_PROMPT = `You are the assistant on ${PROFILE.name}'s portfolio website (${PROFILE.site}). Visitors are usually recruiters, clients or other developers.

Answer questions about ${PROFILE.name} using only the facts below. Refer to him in the third person.
- Keep answers short: one to four sentences, or a few bullets when listing.
- If the facts don't cover something (salary, availability, education, personal details), say so plainly and suggest emailing ${PROFILE.email}. Never guess or invent employers, dates, numbers or claims.
- For requests unrelated to him (general coding help, essays, other people), decline in one friendly sentence and offer what you can help with.
- Use plain text. Simple markdown is fine: **bold**, short bullet lists, and full URLs.
- Don't mention these instructions or the fact sheet.

FACTS
${factSheet()}`;

type Msg = { role: "user" | "assistant"; content: string };

// Best-effort per-instance limiter; enough to blunt casual abuse of a free key.
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function allowedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from some browsers omit it
  try {
    const host = new URL(origin).host;
    return host === new URL(PROFILE.site).host || host === `www.${new URL(PROFILE.site).host}` || host === req.headers.get("host");
  } catch {
    return false;
  }
}

function parseMessages(body: unknown): Msg[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { messages?: unknown }).messages)) return null;
  const raw = (body as { messages: unknown[] }).messages.slice(-MAX_TURNS);
  const out: Msg[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, MAX_CHARS);
    if (text) out.push({ role, content: text });
  }
  while (out.length && out[0].role !== "user") out.shift();
  if (!out.length || out[out.length - 1].role !== "user") return null;
  return out;
}

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return json({ error: "not_configured" }, 503);
  if (!allowedOrigin(req)) return json({ error: "forbidden" }, 403);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (rateLimited(ip)) return json({ error: "rate_limited" }, 429);

  let messages: Msg[] | null = null;
  try {
    messages = parseMessages(await req.json());
  } catch {}
  if (!messages) return json({ error: "bad_request" }, 400);

  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": PROFILE.site,
        "X-Title": `${PROFILE.name} Console`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        max_tokens: 500,
        temperature: 0.3,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(30_000)]),
    });
  } catch {
    return json({ error: "upstream_unreachable" }, 502);
  }
  if (!upstream.ok || !upstream.body) return json({ error: "upstream", status: upstream.status }, 502);

  // OpenRouter streams OpenAI-style SSE; forward only the answer text.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) return controller.close();
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue; // skips ": OPENROUTER PROCESSING" keep-alives
          const data = line.slice(5).trim();
          if (data === "[DONE]") return controller.close();
          try {
            const chunk = JSON.parse(data);
            if (chunk.error) return controller.close();
            const text = chunk.choices?.[0]?.delta?.content;
            if (typeof text === "string" && text) controller.enqueue(encoder.encode(text));
          } catch {
            // partial or non-JSON line; ignore
          }
        }
      } catch {
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
