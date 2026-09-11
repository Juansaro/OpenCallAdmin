"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Faq, Manual } from "@/lib/types";

export default function ConocimientoPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"faq" | "manuales">("faq");

  useEffect(() => {
    api<{ faqs: Faq[]; manuals: Manual[] }>("/api/knowledge").then((d) => {
      setFaqs(d.faqs);
      setManuals(d.manuals);
    });
  }, []);

  const filtered = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(query.toLowerCase()) ||
      f.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <AppShell>
      <main className="px-6 py-6 lg:px-10 max-w-4xl">
        <h1 className="font-display text-3xl">Base de conocimiento</h1>
        <p className="text-muted mt-2">
          Dudas frecuentes listas para L2. Los manuales de producto los cargará el cliente; hay una guía de filtrado mientras tanto.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("faq")}
            className={`rounded-full px-3 py-2 text-sm ${tab === "faq" ? "bg-ink text-paper" : "border border-line"}`}
          >
            FAQ
          </button>
          <button
            type="button"
            onClick={() => setTab("manuales")}
            className={`rounded-full px-3 py-2 text-sm ${tab === "manuales" ? "bg-ink text-paper" : "border border-line"}`}
          >
            Manuales
          </button>
        </div>
        {tab === "faq" ? (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar FAQ"
              className="mt-4 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm"
            />
            <ul className="mt-4 space-y-3">
              {filtered.map((f) => (
                <li key={f.id} className="panel rounded-2xl p-4">
                  <p className="font-medium">{f.question}</p>
                  <p className="text-sm text-muted mt-1">{f.answer}</p>
                  <p className="text-xs mt-2">
                    {f.category} · {f.l2Resolvable ? "Resoluble en L2" : "Escalar si no cede"}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <ul className="mt-4 space-y-3">
            {manuals.map((m) => (
              <li key={m.id} className="panel rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-muted">
                  {m.status === "pendiente_cliente" ? "Pendiente del cliente" : "Activo"} · {formatDate(m.updatedAt)}
                </p>
                <h2 className="font-medium mt-1">{m.title}</h2>
                <p className="text-sm text-muted">{m.summary}</p>
                {m.sections.map((s) => (
                  <div key={s.heading} className="mt-3">
                    <p className="text-sm font-medium">{s.heading}</p>
                    <p className="text-sm text-muted">{s.body}</p>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
