import type { Store, Ticket } from "./types";
import { nextId, nowIso } from "./ids";

export function enqueueCrmEvent(
  store: Store,
  type: string,
  ticket: Ticket,
  extra: Record<string, unknown> = {},
) {
  const target =
    store.settings.crm.mode === "externo" && store.settings.crm.webhookUrl
      ? store.settings.crm.webhookUrl
      : "nativo";
  store.crmOutbox.unshift({
    id: nextId("EVT", store.crmOutbox.map((e) => e.id)),
    at: nowIso(),
    type,
    target,
    delivered: true,
    payload: {
      ticketId: ticket.id,
      status: ticket.status,
      customerId: ticket.customerId,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      escalated: ticket.escalated,
      ...extra,
    },
  });
  ticket.crmSync = {
    status: target === "nativo" ? "nativo" : "enviado",
    lastEvent: type,
    externalId: ticket.crmSync?.externalId,
  };
}
