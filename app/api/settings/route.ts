import { NextResponse } from "next/server";
import { getStore, updateStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const store = await getStore();
  return NextResponse.json(store.settings);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    clientName?: string;
    crmMode?: "nativo" | "externo";
    webhookUrl?: string;
    telephonyProvider?: "pendiente" | "twilio" | "telnyx" | "sip";
  };
  const settings = await updateStore((store) => {
    if (body.clientName) store.settings.clientName = body.clientName;
    if (body.crmMode) store.settings.crm.mode = body.crmMode;
    if (body.webhookUrl !== undefined) store.settings.crm.webhookUrl = body.webhookUrl;
    if (body.telephonyProvider) store.settings.telephony.provider = body.telephonyProvider;
    if (body.telephonyProvider && body.telephonyProvider !== "pendiente") {
      store.settings.telephony.status = "conectado";
    }
    return store.settings;
  });
  return NextResponse.json(settings);
}
