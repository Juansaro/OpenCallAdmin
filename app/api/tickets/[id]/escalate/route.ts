import { NextResponse } from "next/server";
import { enqueueCrmEvent } from "@/lib/crm";
import { nowIso } from "@/lib/ids";
import { updateStore } from "@/lib/store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    protocolId: string;
    destination: string;
    reason: string;
    checklist: string[];
  };
  const ticket = await updateStore((store) => {
    const current = store.tickets.find((t) => t.id === id);
    if (!current) return null;
    const protocol = store.protocols.find((p) => p.id === body.protocolId) ?? store.protocols[0];
    const required = protocol.steps.filter((s) => s.required).map((s) => s.title);
    const missing = required.filter((title) => !body.checklist?.includes(title));
    if (missing.length) {
      return { error: `Faltan pasos del protocolo: ${missing.join(", ")}` } as const;
    }
    current.status = "escalado";
    current.escalated = true;
    current.updatedAt = nowIso();
    current.escalation = {
      protocolId: protocol.id,
      destination: body.destination,
      reason: body.reason,
      checklist: body.checklist,
      at: nowIso(),
    };
    current.events.unshift({
      at: nowIso(),
      actor: store.agents[0]?.name ?? "Agente",
      type: "escalado",
      message: `Escalado a ${body.destination}: ${body.reason}`,
    });
    enqueueCrmEvent(store, "ticket.escalated", current, {
      destination: body.destination,
    });
    return current;
  });
  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  if ("error" in ticket) return NextResponse.json(ticket, { status: 400 });
  return NextResponse.json(ticket);
}
