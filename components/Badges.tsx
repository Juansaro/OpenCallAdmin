import type { TicketPriority, TicketStatus } from "@/lib/types";
import { priorityLabel, ticketStatusLabel } from "@/lib/format";

const statusClass: Record<TicketStatus, string> = {
  nuevo: "bg-[#efe7d8] text-ink",
  en_progreso: "bg-[#dceee6] text-ok",
  resuelto: "bg-[#dceee6] text-ok",
  escalado: "bg-[#f8e4d6] text-live",
  cerrado: "bg-[#eeeae3] text-muted",
};

const priorityClass: Record<TicketPriority, string> = {
  baja: "text-muted",
  media: "text-info",
  alta: "text-live",
  critica: "bg-[#f8e4d6] text-live",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${statusClass[status]}`}
    >
      {ticketStatusLabel[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`text-[12px] font-semibold ${priorityClass[priority]}`}>
      {priorityLabel[priority]}
    </span>
  );
}
