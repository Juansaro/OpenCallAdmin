"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Protocol } from "@/lib/types";

export default function ProtocolosPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);

  useEffect(() => {
    api<Protocol[]>("/api/protocols").then(setProtocols);
  }, []);

  return (
    <AppShell>
      <main className="px-6 py-6 lg:px-10 max-w-3xl">
        <h1 className="font-display text-3xl">Protocolo de escalado</h1>
        <p className="text-muted mt-2">
          Plantilla de filtrado inicial y destinos. El cliente entregará su protocolo definitivo y se versionará aquí.
        </p>
        {protocols.map((p) => (
          <article key={p.id} className="panel rounded-2xl p-5 mt-5">
            <p className="text-xs uppercase tracking-wide text-muted">
              {p.source === "plantilla" ? "Plantilla OpenCall" : "Definido por el cliente"} · {p.version}
            </p>
            <h2 className="font-display text-2xl mt-1">{p.name}</h2>
            <p className="text-sm text-muted mt-2">{p.description}</p>
            <h3 className="mt-5 font-medium">Pasos antes de escalar</h3>
            <ol className="mt-2 space-y-2">
              {p.steps.map((s, i) => (
                <li key={s.id} className="text-sm">
                  <span className="font-medium">
                    {i + 1}. {s.title}
                  </span>
                  <span className="block text-muted">{s.detail}</span>
                </li>
              ))}
            </ol>
            <h3 className="mt-5 font-medium">Matriz de destinos</h3>
            <ul className="mt-2 space-y-2">
              {p.rules.map((r) => (
                <li key={r.id} className="text-sm border-t border-line pt-2">
                  <p>{r.when}</p>
                  <p className="text-muted">
                    → {r.destination} · SLA {r.slaMinutes} min
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </main>
    </AppShell>
  );
}
