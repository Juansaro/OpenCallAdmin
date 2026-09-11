"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { CrmEvent, Settings } from "@/lib/types";

type CrmInfo = {
  mode: Settings["crm"]["mode"];
  webhookUrl: string;
  apiEnabled: boolean;
  events: CrmEvent[];
  samplePayload: Record<string, unknown>;
};

export default function IntegracionesPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [crm, setCrm] = useState<CrmInfo | null>(null);
  const [clientName, setClientName] = useState("");
  const [webhook, setWebhook] = useState("");
  const [mode, setMode] = useState<"nativo" | "externo">("nativo");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api<Settings>("/api/settings"), api<CrmInfo>("/api/crm/events")]).then(
      ([s, c]) => {
        setSettings(s);
        setCrm(c);
        setClientName(s.clientName);
        setWebhook(s.crm.webhookUrl);
        setMode(s.crm.mode);
      },
    );
  }, []);

  async function save() {
    const next = await api<Settings>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({
        clientName,
        crmMode: mode,
        webhookUrl: webhook,
      }),
    });
    setSettings(next);
    setSaved("Configuración guardada. Los nuevos tickets usarán este destino CRM.");
  }

  return (
    <AppShell>
      <main className="px-6 py-6 lg:px-10 max-w-3xl">
        <h1 className="font-display text-3xl">Integraciones</h1>
        <p className="text-muted mt-2">
          La línea en la nube y los manuales los entrega el cliente. El CRM nativo ya registra tickets y puede
          publicarlos a su sistema.
        </p>

        {saved ? <p className="mt-3 text-sm text-ok">{saved}</p> : null}

        <section className="panel rounded-2xl p-5 mt-5">
          <h2 className="font-medium">Línea telefónica en la nube</h2>
          <p className="text-sm mt-2">{settings?.lineNumber}</p>
          <p className="text-sm text-muted">
            Estado: {settings?.telephony.status === "awaiting_client" ? "esperando acceso del cliente" : settings?.telephony.status}
          </p>
          <p className="text-sm mt-3">
            Webhook de entrada: <code className="text-xs bg-paper px-1 py-0.5 rounded">{settings?.telephony.inboundWebhook}</code>
          </p>
          <pre className="mt-3 overflow-auto rounded-xl bg-ink text-[#efe7d6] p-3 text-xs">
{`POST /api/telephony/inbound
{
  "from": "+57 300 415 8821",
  "to": "+57 601 555 0100",
  "callSid": "CA_del_proveedor"
}`}
          </pre>
        </section>

        <section className="panel rounded-2xl p-5 mt-4">
          <h2 className="font-medium">CRM</h2>
          <p className="text-sm text-muted mt-1">
            Modo nativo para operar desde el primer día. Modo externo para enviar cada alta, cambio o escalado
            al CRM del cliente.
          </p>
          <label className="mt-3 block text-xs text-muted">Nombre del cliente</label>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          />
          <label className="mt-3 block text-xs text-muted">Modo</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "nativo" | "externo")}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          >
            <option value="nativo">CRM nativo OpenCall</option>
            <option value="externo">Webhook al CRM del cliente</option>
          </select>
          <label className="mt-3 block text-xs text-muted">URL del webhook CRM</label>
          <input
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            placeholder="https://crm.cliente.com/hooks/opencall"
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          />
          <button type="button" onClick={save} className="mt-4 rounded-full bg-ink px-4 py-2 text-sm text-paper">
            Guardar
          </button>
          <button
            type="button"
            onClick={async () => {
              await api("/api/session", { method: "POST" });
              window.location.reload();
            }}
            className="mt-4 ml-2 rounded-full border border-line px-4 py-2 text-sm"
          >
            Restaurar datos de demostración
          </button>
          <p className="text-xs text-muted mt-3">Eventos: ticket.created, ticket.updated, ticket.escalated, ticket.resolved</p>
          <pre className="mt-3 overflow-auto rounded-xl bg-ink text-[#efe7d6] p-3 text-xs">
            {JSON.stringify(crm?.samplePayload, null, 2)}
          </pre>
        </section>

        <section className="panel rounded-2xl p-5 mt-4">
          <h2 className="font-medium">Bandeja de eventos CRM</h2>
          <ul className="mt-3 space-y-2">
            {crm?.events.map((e) => (
              <li key={e.id} className="text-sm border-t border-line pt-2">
                <p>
                  {e.type} · {e.target}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(e.at)} · {e.delivered ? "entregado" : "pendiente"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </AppShell>
  );
}
