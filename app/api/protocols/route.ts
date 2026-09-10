import { NextResponse } from "next/server";
import { getStore, updateStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const store = await getStore();
  return NextResponse.json(store.protocols);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id: string; description?: string; source?: "plantilla" | "cliente" };
  const protocol = await updateStore((store) => {
    const current = store.protocols.find((p) => p.id === body.id);
    if (!current) return null;
    if (body.description) current.description = body.description;
    if (body.source) current.source = body.source;
    return current;
  });
  if (!protocol) return NextResponse.json({ error: "Protocolo no encontrado" }, { status: 404 });
  return NextResponse.json(protocol);
}
