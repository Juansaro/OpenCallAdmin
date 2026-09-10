import { NextResponse } from "next/server";
import { nextId, nowIso } from "@/lib/ids";
import { findCustomerByPhone, liveCalls } from "@/lib/metrics";
import { getStore, updateStore } from "@/lib/store";
import type { Call } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const store = await getStore();
  return NextResponse.json({
    calls: [...store.calls].sort((a, b) => b.queuedAt.localeCompare(a.queuedAt)),
    live: liveCalls(store),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    from?: string;
    customerId?: string;
  };
  const call = await updateStore((store) => {
    const customer =
      (body.customerId && store.customers.find((c) => c.id === body.customerId)) ||
      (body.from ? findCustomerByPhone(store, body.from) : undefined) ||
      store.customers[Math.floor(Math.random() * store.customers.length)];
    const created: Call = {
      id: nextId(
        "CALL",
        store.calls.map((c) => c.id),
      ),
      customerId: customer?.id,
      from: body.from ?? customer?.phone ?? "+57 300 000 0000",
      to: store.settings.lineNumber.split("·")[0].trim() || "+57 601 555 0100",
      status: "sonando",
      queuedAt: nowIso(),
      holdSeconds: 0,
      notes: "",
    };
    store.calls.unshift(created);
    return created;
  });
  return NextResponse.json(call, { status: 201 });
}
