"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Script } from "@/lib/types";

export default function GuionesPage() {
  const [scripts, setScripts] = useState<Script[]>([]);

  useEffect(() => {
    api<Script[]>("/api/scripts").then(setScripts);
  }, []);

  return (
    <AppShell>
      <main className="px-6 py-6 lg:px-10 max-w-3xl">
        <h1 className="font-display text-3xl">Guiones base</h1>
        <p className="text-muted mt-2">
          Plantillas de conversación. El cliente puede sustituirlas por las suyas sin cambiar el flujo de la consola.
        </p>
        <ul className="mt-5 space-y-4">
          {scripts.map((s) => (
            <li key={s.id} className="panel rounded-2xl p-5">
              <h2 className="font-display text-2xl">{s.name}</h2>
              <p className="text-sm text-muted">{s.scenario}</p>
              <ol className="mt-3 space-y-2">
                {s.steps.map((step, i) => (
                  <li key={step.id}>
                    <p className="text-sm font-medium">
                      {i + 1}. {step.title}
                      {step.proactive ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-ok">Proactivo</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted">{step.text}</p>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </main>
    </AppShell>
  );
}
