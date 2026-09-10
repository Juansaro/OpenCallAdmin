"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import { categoryLabel, formatDate } from "@/lib/format";
import type { Call, Customer, Ticket } from "@/lib/types";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [customer, setCustomer] = useState<Customer | undefined>();
  const [call, setCall] = useState<Call | undefined>();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    api<{ ticket: Ticket; customer?: Customer; call?: Call }>(`/api/tickets/${params.id}`)
      .then((data) => {
        setTicket(data.ticket);
        setCustomer(data.customer);
        setCall(data.call);
      })
      .catch(() => undefined);
  }, [params.id]);

  async function reload() {
    const data = await api<{ ticket: Ticket; customer?: Customer; call?: Call }>(
      `/api/tickets/${params.id}`,
    );
    setTicket(data.ticket);
    setCustomer(data.customer);
    setCall(data.call);
  }

  async function addNote() {
    if (!ticket || !note.trim()) return;
    await api(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      body: JSON.stringify({ note }),
    });
    setNote("");
    setMessage("Nota guardada en el CRM");
    await reload();
  }

  async function resolve() {
    if (!ticket) return;
    await api(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      body: JSON.stringify({ resolve: true }),
    });
    setMessage("Ticket resuelto en L2");
    await reload();
  }

  if (!ticket) {
    return (
      <AppShell>
        <main className="px-6 py-10 text-muted">Cargando ticket…</main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="px-6 py-6 lg:px-10 max-w-4xl">
        <Link href="/tickets" className="text-sm text-info">
          ← CRM
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">{ticket.id}</p>
            <h1 className="font-display text-3xl">{ticket.subject}</h1>
            <p className="text-sm text-muted mt-2">
              {categoryLabel[ticket.category]} · Canal {ticket.channel} · {formatDate(ticket.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        {message ? <p className="mt-4 text-sm text-ok">{message}</p> : null}

        <section className="panel rounded-2xl p-5 mt-5">
          <h2 className="font-medium">Cliente</h2>
          <p className="mt-1">
            {customer?.name} · {customer?.company}
          </p>
          <p className="text-sm text-muted">
            {customer?.phone} · {customer?.email} · {customer?.accountId}
          </p>
          {call ? (
            <p className="text-sm text-muted mt-2">
              Llamada {call.id} · {call.from} · {formatDate(call.queuedAt)}
            </p>
          ) : null}
          <p className="mt-3 text-sm whitespace-pre-wrap">{ticket.description}</p>
          {ticket.escalation ? (
            <div className="mt-4 rounded-xl bg-live/10 p-3 text-sm">
              <p className="font-medium">Escalado a {ticket.escalation.destination}</p>
              <p className="text-muted">{ticket.escalation.reason}</p>
              <p className="text-xs mt-1">{ticket.escalation.checklist.join(" · ")}</p>
            </div>
          ) : null}
          <p className="text-xs text-muted mt-3">
            CRM: {ticket.crmSync?.status ?? "pendiente"}
            {ticket.crmSync?.lastEvent ? ` · ${ticket.crmSync.lastEvent}` : ""}
          </p>
        </section>

        <section className="panel rounded-2xl p-5 mt-4">
          <h2 className="font-medium">Línea de tiempo</h2>
          <ul className="mt-3 space-y-3">
            {ticket.events.map((ev, i) => (
              <li key={`${ev.at}-${i}`} className="text-sm">
                <p className="text-xs text-muted">
                  {formatDate(ev.at)} · {ev.actor} · {ev.type}
                </p>
                <p>{ev.message}</p>
              </li>
            ))}
          </ul>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-4 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
            placeholder="Añadir nota al CRM"
          />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={addNote} className="rounded-full border border-line px-4 py-2 text-sm">
              Guardar nota
            </button>
            {ticket.status !== "resuelto" && ticket.status !== "cerrado" ? (
              <button type="button" onClick={resolve} className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
                Resolver en L2
              </button>
            ) : null}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
