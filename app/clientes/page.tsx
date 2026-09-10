"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Customer, Ticket } from "@/lib/types";

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([api<Customer[]>("/api/customers"), api<Ticket[]>("/api/tickets")]).then(
      ([c, t]) => {
        setCustomers(c);
        setTickets(t);
      },
    );
  }, []);

  const filtered = customers.filter((c) =>
    `${c.name} ${c.company} ${c.phone} ${c.accountId}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AppShell>
      <main className="px-6 py-6 lg:px-10">
        <h1 className="font-display text-3xl">Clientes</h1>
        <p className="text-muted mt-2">Fichas usadas al atender. El número de la llamada se cruza con el CRM.</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar"
          className="mt-4 rounded-full border border-line bg-panel px-4 py-2 text-sm w-72"
        />
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {filtered.map((c) => {
            const open = tickets.filter(
              (t) => t.customerId === c.id && (t.status === "nuevo" || t.status === "en_progreso" || t.status === "escalado"),
            );
            return (
              <article key={c.id} className="panel rounded-2xl p-4">
                <h2 className="font-medium">{c.name}</h2>
                <p className="text-sm">{c.company}</p>
                <p className="text-sm text-muted">{c.phone} · {c.email}</p>
                <p className="text-xs mt-2">
                  {c.plan} · {c.accountId} · {open.length} tickets abiertos
                </p>
                <p className="text-xs text-muted mt-2">{c.notes}</p>
                {open[0] ? (
                  <Link href={`/tickets/${open[0].id}`} className="text-xs text-info mt-2 inline-block">
                    Ver {open[0].id}
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
