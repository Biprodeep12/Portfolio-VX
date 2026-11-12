"use client";

// Tiny in-memory audit trail. Every meaningful visitor action is recorded
// here and streamed into the shell, the same way a cloud console logs API
// calls. Nothing leaves the browser.

export type AuditEvent = { t: number; action: string; target: string; status: number; ms: number };

const listeners = new Set<(e: AuditEvent) => void>();
const history: AuditEvent[] = [];

export function audit(action: string, target = "-", status = 200) {
  const e: AuditEvent = { t: Date.now(), action, target, status, ms: 4 + Math.round(Math.random() * 38) };
  history.push(e);
  if (history.length > 200) history.shift();
  listeners.forEach((l) => l(e));
}

export function onAudit(fn: (e: AuditEvent) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const auditHistory = () => history.slice();

let session: { id: string; zone: string; started: number } | null = null;

export function getSession() {
  if (!session) {
    const hex = Array.from(crypto.getRandomValues(new Uint8Array(2)), (b) => b.toString(16).padStart(2, "0")).join("");
    let zone = "unknown";
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone || zone;
    } catch {}
    session = { id: `guest-${hex}`, zone, started: Date.now() };
  }
  return session;
}
