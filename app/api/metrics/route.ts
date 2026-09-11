import { NextResponse } from "next/server";
import { computeMetrics } from "@/lib/metrics";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const store = await getStore();
  return NextResponse.json(computeMetrics(store));
}
