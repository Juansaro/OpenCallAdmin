import { NextResponse } from "next/server";
import { nextId, nowIso } from "@/lib/ids";
import { getStore, updateStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const store = await getStore();
  return NextResponse.json(store.customers);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name: string;
    company: string;
    phone: string;
    email: string;
    plan?: string;
    accountId?: string;
    notes?: string;
  };
  const customer = await updateStore((store) => {
    const created = {
      id: nextId(
        "CUS",
        store.customers.map((c) => c.id),
      ),
      name: body.name,
      company: body.company,
      phone: body.phone,
      email: body.email,
      plan: body.plan ?? "Starter",
      accountId: body.accountId ?? `AC-${Date.now()}`,
      notes: body.notes ?? "",
      createdAt: nowIso(),
    };
    store.customers.unshift(created);
    return created;
  });
  return NextResponse.json(customer, { status: 201 });
}
