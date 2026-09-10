import { NextResponse } from "next/server";
import { enqueueCrmEvent } from "@/lib/crm";
import { nowIso } from "@/lib/ids";
import { getStore, updateStore } from "@/lib/store";
import type { Ticket, TicketStatus } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const store = await getStore();
  const ticket = store.tickets.find((t) => t.id === id);
  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  const customer = store.customers.find((c) => c.id === ticket.customerId);
  const call = store.calls.find((c) => c.id === ticket.callId);
  return NextResponse.json({ ticket, customer, call });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as Partial<Ticket> & {
    note?: string;
    resolve?: boolean;
  };
  const ticket = await updateStore((store) => {
    const current = store.tickets.find((t) => t.id === id);
    if (!current) return null;
    const actor = store.agents[0]?.name ?? "Agente";
    if (body.subject) current.subject = body.subject;
    if (body.description !== undefined) current.description = body.description;
    if (body.category) current.category = body.category;
    if (body.priority) current.priority = body.priority;
    if (body.status) current.status = body.status as TicketStatus;
    if (body.note) {
      current.events.unshift({
        at: nowIso(),
        actor,
        type: "nota",
        message: body.note,
      });
    }
    if (body.resolve) {
      current.status = "resuelto";
      current.resolvedAt = nowIso();
      current.events.unshift({
        at: nowIso(),
        actor,
        type: "resuelto",
        message: "Caso resuelto en soporte intermedio.",
      });
      enqueueCrmEvent(store, "ticket.resolved", current);
    } else {
      current.events.unshift({
        at: nowIso(),
        actor,
        type: "actualizado",
        message: "Ticket actualizado en el CRM.",
      });
      enqueueCrmEvent(store, "ticket.updated", current);
    }
    current.updatedAt = nowIso();
    if (!current.firstResponseAt) current.firstResponseAt = nowIso();
    return current;
  });
  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  return NextResponse.json(ticket);
}
