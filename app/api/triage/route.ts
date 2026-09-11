import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { classifyIncident } from "@/lib/triage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { text: string };
  const store = await getStore();
  const result = classifyIncident(body.text ?? "", store.faqs);
  const faqs = store.faqs.filter((f) => result.faqIds.includes(f.id));
  const script = store.scripts.find((s) => s.id === result.scriptId);
  return NextResponse.json({ ...result, faqs, script });
}
