import { NextResponse } from "next/server";
import { customerById, ticketsForCustomer } from "@/lib/metrics";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const store = await getStore();
  const live = store.calls.find(
    (c) => c.status === "sonando" || c.status === "en_curso" || c.status === "en_espera",
  );
  const customer = customerById(store, live?.customerId);
  return NextResponse.json({
    agent: store.agents[0],
    settings: store.settings,
    live,
    customer,
    tickets: customer ? ticketsForCustomer(store, customer.id) : [],
    faqs: store.faqs,
    scripts: store.scripts,
    protocols: store.protocols,
    manuals: store.manuals,
  });
}
