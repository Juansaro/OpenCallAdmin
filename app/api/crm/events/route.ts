import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const store = await getStore();
  return NextResponse.json({
    mode: store.settings.crm.mode,
    webhookUrl: store.settings.crm.webhookUrl,
    apiEnabled: store.settings.crm.apiEnabled,
    events: store.crmOutbox.slice(0, 20),
    samplePayload: {
      type: "ticket.created",
      ticketId: "TKT-1046",
      status: "nuevo",
      customerId: "CUS-101",
      subject: "Ejemplo de registro en el CRM del cliente",
      category: "consulta",
      priority: "media",
      channel: "telefono",
    },
  });
}
