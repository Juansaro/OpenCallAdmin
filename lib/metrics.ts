import type { Call, Store, Ticket } from "./types";

export type Metrics = {
  callsToday: number;
  answeredToday: number;
  missedToday: number;
  avgAnswerSeconds: number | null;
  avgHandleSeconds: number | null;
  ticketsOpen: number;
  ticketsEscalated: number;
  l2ResolutionRate: number | null;
  firstResponseMinutes: number | null;
  queue: number;
};

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function avg(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function isToday(iso: string): boolean {
  return new Date(iso).getTime() >= startOfToday();
}

function secondsBetween(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
}

export function computeMetrics(store: Store): Metrics {
  const callsToday = store.calls.filter((c) => isToday(c.queuedAt));
  const answered = callsToday.filter((c) => c.answeredAt);
  const missed = callsToday.filter((c) => c.status === "perdida");
  const closedTickets = store.tickets.filter((t) => t.status === "resuelto" || t.status === "cerrado");
  const l2Resolved = closedTickets.filter((t) => !t.escalated);
  const firstResponses = store.tickets
    .filter((t) => t.firstResponseAt)
    .map((t) => secondsBetween(t.createdAt, t.firstResponseAt) ?? 0)
    .filter((n) => n >= 0);

  return {
    callsToday: callsToday.length,
    answeredToday: answered.length,
    missedToday: missed.length,
    avgAnswerSeconds: avg(
      answered
        .map((c) => secondsBetween(c.queuedAt, c.answeredAt))
        .filter((n): n is number => n !== null),
    ),
    avgHandleSeconds: avg(
      callsToday
        .map((c) => secondsBetween(c.answeredAt, c.endedAt))
        .filter((n): n is number => n !== null),
    ),
    ticketsOpen: store.tickets.filter((t) => t.status === "nuevo" || t.status === "en_progreso").length,
    ticketsEscalated: store.tickets.filter((t) => t.status === "escalado").length,
    l2ResolutionRate: closedTickets.length
      ? Math.round((l2Resolved.length / closedTickets.length) * 100)
      : null,
    firstResponseMinutes: firstResponses.length ? Math.round((avg(firstResponses) ?? 0) / 60) : null,
    queue: store.calls.filter((c) => c.status === "sonando").length,
  };
}

export function customerById(store: Store, id?: string) {
  if (!id) return undefined;
  return store.customers.find((c) => c.id === id);
}

export function ticketsForCustomer(store: Store, customerId: string): Ticket[] {
  return store.tickets
    .filter((t) => t.customerId === customerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function findCustomerByPhone(store: Store, phone: string) {
  const digits = phone.replace(/\D/g, "");
  return store.customers.find((c) => c.phone.replace(/\D/g, "").endsWith(digits.slice(-10)));
}

export function liveCalls(store: Store): Call[] {
  return store.calls.filter((c) => c.status === "sonando" || c.status === "en_curso" || c.status === "en_espera");
}
