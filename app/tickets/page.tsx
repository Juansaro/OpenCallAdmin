"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import { categoryLabel, formatDate } from "@/lib/format";
import type { Customer, Ticket, TicketStatus } from "@/lib/types";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [status, setStatus] = useState<TicketStatus | "todos">("todos");
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([api<Ticket[]>("/api/tickets"), api<Customer[]>("/api/customers")]).then(
      ([t, c]) => {
        setTickets(t);
        setCustomers(c);
      },
    );
  }, []);

  const names = Object.fromEntries(customers.map((c) => [c.id, c]));
  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const okStatus = status === "todos" || t.status === status;
      const hay = `${t.id} ${t.subject} ${names[t.customerId]?.name ?? ""}`.toLowerCase();
      return okStatus && hay.includes(query.toLowerCase());
    });
  }, [tickets, status, query, names]);

  return (
    <AppShell>
      <main className="px-6 py-6 lg:px-10">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">CRM nativo</p>
        <h1 className="font-display text-3xl mt-1">Tickets</h1>
        <p className="text-muted mt-2 max-w-2xl">
          Cada llamada deja rastro aquí. Si el cliente ya tiene CRM, los eventos se envían al webhook
          para no duplicar el trabajo de sus agentes.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por ticket, asunto o cliente"
            className="rounded-full border border-line bg-panel px-4 py-2 text-sm w-72"
          />
          {(["todos", "nuevo", "en_progreso", "escalado", "resuelto"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-2 text-sm ${
                status === s ? "bg-ink text-paper" : "border border-line bg-panel"
              }`}
            >
              {s === "todos" ? "Todos" : s.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="mt-5 panel overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-3">Ticket</th>
                <th>Cliente</th>
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${t.id}`} className="font-medium hover:underline">
                      {t.id}
                    </Link>
                    <p className="text-muted text-xs mt-0.5">{t.subject}</p>
                  </td>
                  <td>{names[t.customerId]?.name ?? t.customerId}</td>
                  <td>{categoryLabel[t.category]}</td>
                  <td>
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="text-muted">{formatDate(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </AppShell>
  );
}
