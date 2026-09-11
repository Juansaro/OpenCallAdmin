import { NextResponse } from "next/server";
import { enqueueCrmEvent } from "@/lib/crm";
import { nextId, nowIso } from "@/lib/ids";
import { getStore, updateStore } from "@/lib/store";
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const customerId = url.searchParams.get("customerId");
  const store = await getStore();
  let tickets = [...store.tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (status) tickets = tickets.filter((t) => t.status === status);
  if (customerId) tickets = tickets.filter((t) => t.customerId === customerId);
  return NextResponse.json(tickets);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Ticket> & {
    subject: string;
    customerId: string;
  };
  const ticket = await updateStore((store) => {
    const created: Ticket = {
      id: nextId(
        "TKT",
        store.tickets.map((t) => t.id),
      ),
      customerId: body.customerId,
      callId: body.callId,
      subject: body.subject,
      description: body.description ?? "",
      category: (body.category as TicketCategory) ?? "consulta",
      priority: (body.priority as TicketPriority) ?? "media",
      status: (body.status as TicketStatus) ?? "nuevo",
      channel: body.channel ?? "telefono",
      assignee: store.agents[0]?.name ?? "Elena Vargas",
      escalated: false,
      tags: body.tags ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      firstResponseAt: nowIso(),
      events: [
        {
          at: nowIso(),
          actor: store.agents[0]?.name ?? "Agente",
          type: "creado",
          message: "Ticket registrado en el CRM nativo de OpenCall.",
        },
      ],
    };
    store.tickets.unshift(created);
    enqueueCrmEvent(store, "ticket.created", created);
    return created;
  });
  return NextResponse.json(ticket, { status: 201 });
}
