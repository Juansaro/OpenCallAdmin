import type { CallStatus, TicketPriority, TicketStatus } from "./types";

export function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatSeconds(seconds: number | null) {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export const ticketStatusLabel: Record<TicketStatus, string> = {
  nuevo: "Nuevo",
  en_progreso: "En progreso",
  resuelto: "Resuelto",
  escalado: "Escalado",
  cerrado: "Cerrado",
};

export const priorityLabel: Record<TicketPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

export const callStatusLabel: Record<CallStatus, string> = {
  sonando: "Entrante",
  en_curso: "En curso",
  en_espera: "En espera",
  finalizada: "Finalizada",
  perdida: "Perdida",
  transferida: "Transferida",
};

export const categoryLabel: Record<string, string> = {
  consulta: "Consulta",
  incidencia: "Incidencia",
  reclamacion: "Reclamación",
  acceso: "Acceso",
  facturacion: "Facturación",
  producto: "Producto",
};
