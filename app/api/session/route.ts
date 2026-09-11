import { NextResponse } from "next/server";
import { computeMetrics, liveCalls } from "@/lib/metrics";
import { getStore, resetStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const store = await getStore();
  return NextResponse.json({
    agent: store.agents[0],
    metrics: computeMetrics(store),
    settings: store.settings,
    queue: liveCalls(store),
  });
}

export async function POST() {
  const store = await resetStore();
  return NextResponse.json({ ok: true, metrics: computeMetrics(store) });
}
