import { NextResponse } from "next/server";
import { nowIso } from "@/lib/ids";
import { getStore, updateStore } from "@/lib/store";
import type { Call } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const store = await getStore();
  const call = store.calls.find((c) => c.id === id);
  if (!call) return NextResponse.json({ error: "Llamada no encontrada" }, { status: 404 });
  const customer = store.customers.find((c) => c.id === call.customerId);
  const tickets = store.tickets.filter((t) => t.customerId === call.customerId);
  return NextResponse.json({ call, customer, tickets });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    action: "answer" | "hold" | "resume" | "end" | "reject";
    notes?: string;
    ticketId?: string;
    wrapUp?: Call["wrapUp"];
  };
  const call = await updateStore((store) => {
    const current = store.calls.find((c) => c.id === id);
    if (!current) return null;
    const agent = store.agents[0];
    if (body.action === "answer") {
      current.status = "en_curso";
      current.answeredAt = nowIso();
      current.agentId = agent?.id;
      if (agent) agent.status = "en_llamada";
    } else if (body.action === "hold") {
      current.status = "en_espera";
    } else if (body.action === "resume") {
      current.status = "en_curso";
    } else if (body.action === "reject") {
      current.status = "perdida";
      current.endedAt = nowIso();
      if (agent) agent.status = "disponible";
    } else if (body.action === "end") {
      current.status = "finalizada";
      current.endedAt = nowIso();
      current.notes = body.notes ?? current.notes;
      current.ticketId = body.ticketId ?? current.ticketId;
      current.wrapUp = body.wrapUp ?? current.wrapUp;
      if (agent) agent.status = "disponible";
    }
    return current;
  });
  if (!call) return NextResponse.json({ error: "Llamada no encontrada" }, { status: 404 });
  return NextResponse.json(call);
}
