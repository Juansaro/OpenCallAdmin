"use client";

import Link from "next/link";
import { ArrowUpRight, PhoneIncoming, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import { formatDate, formatSeconds } from "@/lib/format";
import type { Metrics } from "@/lib/metrics";
import type { Call, Customer, Ticket } from "@/lib/types";

type Session = {
  agent: { name: string };
  metrics: Metrics;
  settings: { clientName: string; lineNumber: string };
};

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const load = async () => {
      const [s, t, c, people] = await Promise.all([
        api<Session>("/api/session"),
        api<Ticket[]>("/api/tickets"),
        api<{ calls: Call[] }>("/api/calls"),
        api<Customer[]>("/api/customers"),
      ]);
      setSession(s);
      setTickets(t);
      setCalls(c.calls);
      setCustomers(people);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const m = session?.metrics;
  const nameById = Object.fromEntries(customers.map((c) => [c.id, c]));

  return (
    <AppShell>
      <main className="px-6 py-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Soporte intermedio</p>
            <h1 className="font-display text-3xl mt-1">Buen turno, {session?.agent.name ?? "Elena"}.</h1>
            <p className="text-muted mt-2 max-w-xl">
              Atender, resolver dudas frecuentes, filtrar incidencias y escalar con protocolo.
              El CRM registra cada caso para integrar el sistema del cliente.
            </p>
          </div>
          <Link
            href="/consola"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper"
          >
            Abrir consola <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Llamadas hoy" value={m?.callsToday ?? "—"} hint={`${m?.answeredToday ?? 0} atendidas`} />
          <Kpi
            label="Primera respuesta"
            value={formatSeconds(m?.avgAnswerSeconds ?? null)}
            hint="Tiempo medio de toma"
            icon
          />
          <Kpi label="Tickets abiertos" value={m?.ticketsOpen ?? "—"} hint={`${m?.ticketsEscalated ?? 0} escalados`} />
          <Kpi
            label="Resolución en L2"
            value={m?.l2ResolutionRate != null ? `${m.l2ResolutionRate}%` : "—"}
            hint="Cerrados sin escalar"
          />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="panel rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Actividad reciente</h2>
              <Link href="/tickets" className="text-sm text-info">
                Ver CRM
              </Link>
            </div>
            <div className="mt-4 divide-y divide-line">
              {tickets.slice(0, 5).map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-start justify-between gap-3 py-3 hover:bg-paper/60 -mx-2 px-2 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{ticket.subject}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {ticket.id} · {nameById[ticket.customerId]?.name ?? ticket.customerId} ·{" "}
                      {formatDate(ticket.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel rounded-2xl p-5">
            <h2 className="font-display text-xl">Línea y cola</h2>
            <p className="text-sm text-muted mt-2">{session?.settings.lineNumber}</p>
            <p className="text-sm text-muted">{session?.settings.clientName}</p>
            <div className="mt-4 space-y-3">
              {calls.slice(0, 4).map((call) => (
                <div key={call.id} className="flex items-center gap-3 text-sm">
                  <PhoneIncoming size={16} className="text-live" />
                  <div className="min-w-0">
                    <p className="truncate">{call.from}</p>
                    <p className="text-xs text-muted">{formatDate(call.queuedAt)}</p>
                  </div>
                  <span className="ml-auto text-xs uppercase tracking-wide text-muted">
                    {call.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-5 flex items-start gap-2 text-xs text-muted">
              <Timer size={14} className="mt-0.5" />
              El acceso a la línea en la nube lo facilita el cliente. Mientras tanto, simule llamadas desde la consola.
            </p>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon?: boolean;
}) {
  return (
    <div className="panel rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="font-display text-3xl mt-1">{value}</p>
      <p className="text-xs text-muted mt-1 flex items-center gap-1">
        {icon ? <Timer size={12} /> : null}
        {hint}
      </p>
    </div>
  );
}
