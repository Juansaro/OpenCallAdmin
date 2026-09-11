"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Headset,
  LayoutDashboard,
  PhoneCall,
  Plug,
  ScrollText,
  Ticket,
  Users,
  Waypoints,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";
import type { Metrics as MetricsT } from "@/lib/metrics";

const NAV = [
  { href: "/", label: "Panel", icon: LayoutDashboard },
  { href: "/consola", label: "Consola", icon: Headset },
  { href: "/tickets", label: "CRM · Tickets", icon: Ticket },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/conocimiento", label: "Conocimiento", icon: BookOpen },
  { href: "/guiones", label: "Guiones", icon: ScrollText },
  { href: "/protocolos", label: "Protocolos", icon: Waypoints },
  { href: "/integraciones", label: "Integraciones", icon: Plug },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [metrics, setMetrics] = useState<MetricsT | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api<{ agent: Agent; metrics: MetricsT }>("/api/session");
        setAgent(data.agent);
        setMetrics(data.metrics);
      } catch {
        /* keep last */
      }
    };
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-sidebar text-[#efe7d6]">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-live text-white">
            <PhoneCall size={18} />
          </span>
          <div>
            <p className="font-display text-lg leading-none">OpenCall</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#c4b9a6] mt-1">
              Admin L2
            </p>
          </div>
        </div>
        <nav className="p-3 space-y-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-[#c9bfae] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="m-3 mt-8 rounded-xl border border-white/10 p-3">
          <p className="text-[11px] uppercase tracking-wider text-[#c4b9a6]">Agente en turno</p>
          <p className="mt-1 font-medium">{agent?.name ?? "Elena Vargas"}</p>
          <p className="text-xs text-[#c4b9a6]">{agent?.role ?? "Soporte intermedio"}</p>
          <p className="mt-2 flex items-center gap-2 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ext. {agent?.extension ?? "204"}
            {metrics && metrics.queue > 0 ? (
              <span className="ml-auto text-live">Cola {metrics.queue}</span>
            ) : (
              <span className="ml-auto text-[#c4b9a6]">Sin cola</span>
            )}
          </p>
        </div>
      </aside>
      <div className="min-h-screen">{children}</div>
    </div>
  );
}
