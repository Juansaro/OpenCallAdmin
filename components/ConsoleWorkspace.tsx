"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Headphones,
  Pause,
  PhoneOff,
  Phone,
  Play,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { api } from "@/lib/api";
import { categoryLabel, formatClock } from "@/lib/format";
import type {
  Call,
  Customer,
  Faq,
  Protocol,
  Script,
  Ticket,
  TicketCategory,
  TicketPriority,
  TriageResult,
} from "@/lib/types";

type ConsolePayload = {
  agent: { name: string; extension: string };
  live?: Call;
  customer?: Customer;
  tickets: Ticket[];
  faqs: Faq[];
  scripts: Script[];
  protocols: Protocol[];
};

type TriageView = TriageResult & { faqs: Faq[]; script?: Script };

const DISPOSITIONS = [
  { id: "resuelto_l2", label: "Resuelto en L2" },
  { id: "seguimiento", label: "Requiere seguimiento" },
  { id: "escalado", label: "Escalado" },
  { id: "consulta_cerrada", label: "Consulta resuelta" },
];

const PROACTIVE = [
  { id: "resumen_correo", label: "Enviar resumen por correo" },
  { id: "callback_comprometido", label: "Programar devolución de llamada" },
  { id: "confirmar_acceso", label: "Confirmar que el acceso quedó bien" },
  { id: "seguimiento_programado", label: "Seguimiento el mismo día" },
];

export default function ConsolaPage() {
  return (
    <AppShell>
      <ConsoleWorkspace />
    </AppShell>
  );
}

function ConsoleWorkspace() {
  const [data, setData] = useState<ConsolePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("consulta");
  const [priority, setPriority] = useState<TicketPriority>("media");
  const [faqQuery, setFaqQuery] = useState("");
  const [triage, setTriage] = useState<TriageView | null>(null);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [destination, setDestination] = useState("L3 · Plataforma");
  const [reason, setReason] = useState("");
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [wrapOpen, setWrapOpen] = useState(false);
  const [disposition, setDisposition] = useState("resuelto_l2");
  const [proactive, setProactive] = useState<string[]>(["resumen_correo"]);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const payload = await api<ConsolePayload>("/api/console");
    setData(payload);
    return payload;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      refresh().catch(() => undefined);
    }, 2500);
    const boot = setTimeout(() => {
      refresh().catch((e) => setError((e as Error).message));
    }, 0);
    return () => {
      clearInterval(id);
      clearTimeout(boot);
    };
  }, [refresh]);

  const live = data?.live;
  const onCall = live?.status === "en_curso" || live?.status === "en_espera";

  useEffect(() => {
    if (!onCall || !live?.answeredAt) return;
    const tick = () => {
      setSeconds(Math.floor((Date.now() - new Date(live.answeredAt!).getTime()) / 1000));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [onCall, live?.answeredAt, live?.id]);

  const protocol = data?.protocols[0];

  const faqs = (() => {
    const q = faqQuery.toLowerCase();
    const list = data?.faqs ?? [];
    if (!q) return triage?.faqs?.length ? triage.faqs : list.slice(0, 4);
    return list.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  })();

  const script = triage?.script ?? data?.scripts[0];

  async function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  }

  async function simulateCall() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/calls", { method: "POST", body: "{}" });
      await refresh();
      flash("Llamada entrante en cola");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function act(action: "answer" | "hold" | "resume" | "reject") {
    if (!live) return;
    setBusy(true);
    try {
      await api(`/api/calls/${live.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runTriage(text: string) {
    setDescription(text);
    if (text.trim().length < 8) return;
    const result = await api<TriageView>("/api/triage", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    setTriage(result);
    setCategory(result.category);
    setPriority(result.priority);
    if (result.destination) setDestination(result.destination);
    if (!subject) setSubject(text.slice(0, 80));
  }

  async function saveTicket() {
    if (!data?.customer) {
      setError("No hay cliente identificado en la llamada.");
      return;
    }
    setBusy(true);
    try {
      const ticket = await api<Ticket>("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          customerId: data.customer.id,
          callId: live?.id,
          subject: subject || "Atención telefónica",
          description,
          category,
          priority,
          status: "en_progreso",
          channel: "telefono",
        }),
      });
      setActiveTicketId(ticket.id);
      flash(`Ticket ${ticket.id} registrado en el CRM`);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function escalate() {
    const ticketId = activeTicketId ?? data?.tickets[0]?.id;
    if (!ticketId) {
      setError("Registre el ticket en el CRM antes de escalar.");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/tickets/${ticketId}/escalate`, {
        method: "POST",
        body: JSON.stringify({
          protocolId: protocol?.id,
          destination,
          reason,
          checklist,
        }),
      });
      flash("Caso escalado y sincronizado con el CRM");
      setDisposition("escalado");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function finishCall() {
    if (!live) return;
    setBusy(true);
    try {
      await api(`/api/calls/${live.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "end",
          ticketId: activeTicketId,
          notes: description,
          wrapUp: { disposition, proactiveActions: proactive, summary },
        }),
      });
      setWrapOpen(false);
      setSubject("");
      setDescription("");
      setTriage(null);
      setChecklist([]);
      setActiveTicketId(null);
      flash("Llamada cerrada. Wrap-up guardado.");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="px-4 py-5 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Consola de llamadas</p>
          <h1 className="font-display text-3xl mt-1">Atención L2</h1>
        </div>
        <button
          type="button"
          onClick={simulateCall}
          disabled={busy || Boolean(live)}
          className="rounded-full border border-line bg-panel px-4 py-2 text-sm disabled:opacity-50"
        >
          Simular llamada entrante
        </button>
      </div>

      {toast ? (
        <p className="mt-3 rounded-xl bg-ok/10 px-3 py-2 text-sm text-ok">{toast}</p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-xl bg-live/10 px-3 py-2 text-sm text-live">{error}</p>
      ) : null}

      {live?.status === "sonando" ? (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl bg-live px-5 py-4 text-white">
          <span className="live-dot bg-white" />
          <div>
            <p className="text-xs uppercase tracking-widest">Llamada entrante</p>
            <p className="text-lg font-medium">
              {data?.customer?.name ?? "Número no identificado"} · {live.from}
            </p>
            <p className="text-sm text-white/80">
              {data?.customer?.company ?? "Sin ficha CRM"} · {data?.customer?.plan ?? ""}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => act("answer")}
              className="rounded-full bg-white px-4 py-2 text-sm text-ink"
            >
              Atender
            </button>
            <button
              type="button"
              onClick={() => act("reject")}
              className="rounded-full border border-white/40 px-4 py-2 text-sm"
            >
              Rechazar
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <section className="panel rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Headphones size={18} />
            <h2 className="font-medium">Línea</h2>
            {onCall ? <span className="live-dot ml-auto" /> : null}
          </div>
          <p className="font-display text-4xl">{onCall ? formatClock(seconds) : "00:00"}</p>
          <p className="text-sm text-muted">
            {live ? `Estado: ${live.status.replace("_", " ")}` : "Disponible · esperando llamadas"}
          </p>
          {onCall ? (
            <div className="flex flex-wrap gap-2">
              {live?.status === "en_espera" ? (
                <button type="button" onClick={() => act("resume")} className="btn-line">
                  <Play size={14} /> Retomar
                </button>
              ) : (
                <button type="button" onClick={() => act("hold")} className="btn-line">
                  <Pause size={14} /> Espera
                </button>
              )}
              <button type="button" onClick={() => setWrapOpen(true)} className="btn-ink">
                <PhoneOff size={14} /> Finalizar
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted flex items-center gap-2">
              <Phone size={14} /> Softphone listo. La nube se conecta cuando el cliente entregue la línea.
            </p>
          )}

          {data?.customer ? (
            <div className="border-t border-line pt-4 space-y-1 text-sm">
              <p className="text-xs uppercase tracking-wider text-muted">Ficha CRM</p>
              <p className="font-medium">{data.customer.name}</p>
              <p>{data.customer.company}</p>
              <p className="text-muted">{data.customer.phone}</p>
              <p className="text-muted">{data.customer.email}</p>
              <p className="text-xs">
                Plan {data.customer.plan} · {data.customer.accountId}
              </p>
              <p className="text-xs text-muted pt-2">{data.customer.notes}</p>
            </div>
          ) : (
            <p className="text-sm text-muted">Sin cliente en línea. Al atender, se busca la ficha por el número.</p>
          )}

          {data?.tickets?.length ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted mb-2">Historial</p>
              <ul className="space-y-2">
                {data.tickets.slice(0, 3).map((t) => (
                  <li key={t.id} className="text-xs">
                    <span className="font-medium">{t.id}</span>{" "}
                    <StatusBadge status={t.status} />
                    <p className="text-muted mt-0.5">{t.subject}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="panel rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium">Ticket CRM</h2>
            {activeTicketId ? <span className="text-xs text-ok">{activeTicketId}</span> : null}
          </div>
          <p className="text-xs text-muted mt-1">
            Registrar el caso aquí facilita la integración con el CRM del cliente (webhook ticket.created).
          </p>
          <label className="mt-3 block text-xs text-muted">Asunto</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
            placeholder="Resumen de la consulta o incidencia"
          />
          <label className="mt-3 block text-xs text-muted">Qué dice el usuario</label>
          <textarea
            value={description}
            onChange={(e) => runTriage(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
            placeholder="Anote la duda o el síntoma. El filtrado inicial se sugiere solo."
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
              >
                {Object.entries(categoryLabel).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>

          {triage ? (
            <div className="mt-3 rounded-xl border border-line bg-paper p-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                {triage.suggestEscalate ? <TriangleAlert size={16} className="text-live" /> : <Sparkles size={16} className="text-ok" />}
                Filtrado inicial
              </p>
              <p className="text-muted mt-1">{triage.reason}</p>
              <p className="mt-2 text-xs">
                {categoryLabel[triage.category]} · <PriorityBadge priority={triage.priority} />
                {triage.l2Resolvable ? " · Resoluble en L2" : " · No insistir en L2"}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={saveTicket}
            disabled={busy}
            className="mt-4 rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50"
          >
            Registrar ticket en CRM
          </button>

          <div className="mt-6 border-t border-line pt-4">
            <h3 className="font-medium">Escalar según protocolo</h3>
            <p className="text-xs text-muted mt-1">
              {protocol?.name} · {protocol?.version}. El cliente podrá sustituir esta plantilla.
            </p>
            <ul className="mt-3 space-y-2">
              {protocol?.steps.map((step) => (
                <li key={step.id}>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checklist.includes(step.title)}
                      onChange={() =>
                        setChecklist((prev) =>
                          prev.includes(step.title)
                            ? prev.filter((x) => x !== step.title)
                            : [...prev, step.title],
                        )
                      }
                    />
                    <span>
                      <span className="font-medium">{step.title}</span>
                      <span className="block text-xs text-muted">{step.detail}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <label className="mt-3 block text-xs text-muted">Destino</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
            >
              {protocol?.rules.map((r) => (
                <option key={r.id} value={r.destination}>
                  {r.destination} · SLA {r.slaMinutes} min
                </option>
              ))}
            </select>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="mt-3 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
              placeholder="Motivo del escalado"
            />
            <button
              type="button"
              onClick={escalate}
              disabled={busy}
              className="mt-3 rounded-full border border-live px-4 py-2 text-sm text-live disabled:opacity-50"
            >
              Escalar caso
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="panel rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <BookOpen size={16} />
              <h2 className="font-medium">FAQ y manuales</h2>
            </div>
            <input
              value={faqQuery}
              onChange={(e) => setFaqQuery(e.target.value)}
              className="mt-3 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
              placeholder="Buscar duda frecuente"
            />
            <ul className="mt-3 space-y-3">
              {faqs.slice(0, 5).map((faq) => (
                <li key={faq.id} className="text-sm">
                  <p className="font-medium">{faq.question}</p>
                  <p className="text-xs text-muted mt-1">{faq.answer}</p>
                  <p className="text-[11px] mt-1 text-ok">
                    {faq.l2Resolvable ? "Resoluble en L2" : "Escalar si persiste"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel rounded-2xl p-4">
            <h2 className="font-medium">Guion</h2>
            <p className="text-xs text-muted">{script?.name}</p>
            <ol className="mt-3 space-y-2">
              {script?.steps.map((step, i) => (
                <li key={step.id} className="text-sm">
                  <p className="font-medium">
                    {i + 1}. {step.title}{" "}
                    {step.proactive ? (
                      <span className="text-[10px] uppercase tracking-wide text-ok">Proactivo</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      {wrapOpen ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="panel w-full max-w-lg rounded-2xl p-5">
            <h2 className="font-display text-2xl">Cierre de llamada</h2>
            <p className="text-sm text-muted mt-1">
              Documente el wrap-up. La comunicación clara y una acción proactiva reducen rellamadas.
            </p>
            <label className="mt-3 block text-xs text-muted">Disposición</label>
            <select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
            >
              {DISPOSITIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            <p className="mt-3 text-xs text-muted">Acciones proactivas</p>
            <ul className="mt-1 space-y-1">
              {PROACTIVE.map((p) => (
                <li key={p.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={proactive.includes(p.id)}
                      onChange={() =>
                        setProactive((prev) =>
                          prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                        )
                      }
                    />
                    {p.label}
                  </label>
                </li>
              ))}
            </ul>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="mt-3 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
              placeholder="Qué se resolvió y qué queda pendiente"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setWrapOpen(false)} className="rounded-full px-4 py-2 text-sm">
                Seguir en la llamada
              </button>
              <button type="button" onClick={finishCall} className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
                <CheckCircle2 size={14} className="inline mr-1" />
                Guardar y colgar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
