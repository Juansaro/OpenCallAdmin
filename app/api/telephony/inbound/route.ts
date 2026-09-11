import { NextResponse } from "next/server";
import { nextId, nowIso } from "@/lib/ids";
import { findCustomerByPhone } from "@/lib/metrics";
import { updateStore } from "@/lib/store";
import type { Call } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Webhook genérico para la línea telefónica en la nube.
 * El cliente apuntará aquí su proveedor (Twilio, Telnyx, SIP, etc.).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    from?: string;
    to?: string;
    callSid?: string;
    From?: string;
    To?: string;
    CallSid?: string;
  };
  const from = body.from ?? body.From;
  const to = body.to ?? body.To;
  const callSid = body.callSid ?? body.CallSid;
  if (!from) {
    return NextResponse.json(
      { error: "Se espera { from, to?, callSid? } desde la línea en la nube" },
      { status: 400 },
    );
  }
  const call = await updateStore((store) => {
    const customer = findCustomerByPhone(store, from);
    const created: Call = {
      id: nextId(
        "CALL",
        store.calls.map((c) => c.id),
      ),
      customerId: customer?.id,
      from,
      to: to ?? store.settings.lineNumber,
      status: "sonando",
      queuedAt: nowIso(),
      holdSeconds: 0,
      notes: "",
      providerCallId: callSid,
    };
    store.calls.unshift(created);
    return created;
  });
  return NextResponse.json({ ok: true, call });
}
