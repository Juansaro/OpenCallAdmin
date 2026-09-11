export type TicketStatus =
  | "nuevo"
  | "en_progreso"
  | "resuelto"
  | "escalado"
  | "cerrado";

export type TicketPriority = "baja" | "media" | "alta" | "critica";

export type TicketCategory =
  | "consulta"
  | "incidencia"
  | "reclamacion"
  | "acceso"
  | "facturacion"
  | "producto";

export type CallStatus =
  | "sonando"
  | "en_curso"
  | "en_espera"
  | "finalizada"
  | "perdida"
  | "transferida";

export type AgentStatus = "disponible" | "en_llamada" | "pausa" | "after_call";

export type TimelineEvent = {
  at: string;
  actor: string;
  type:
    | "creado"
    | "actualizado"
    | "nota"
    | "escalado"
    | "resuelto"
    | "llamada"
    | "crm"
    | "proactivo";
  message: string;
};

export type Customer = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  plan: string;
  accountId: string;
  notes: string;
  createdAt: string;
};

export type Ticket = {
  id: string;
  customerId: string;
  callId?: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  channel: "telefono" | "crm" | "manual";
  assignee: string;
  escalated: boolean;
  escalation?: {
    protocolId: string;
    destination: string;
    reason: string;
    checklist: string[];
    at: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  events: TimelineEvent[];
  crmSync?: {
    status: "pendiente" | "enviado" | "error" | "nativo";
    externalId?: string;
    lastEvent?: string;
  };
};

export type Call = {
  id: string;
  customerId?: string;
  ticketId?: string;
  from: string;
  to: string;
  status: CallStatus;
  queuedAt: string;
  answeredAt?: string;
  endedAt?: string;
  agentId?: string;
  holdSeconds: number;
  notes: string;
  wrapUp?: {
    disposition: string;
    proactiveActions: string[];
    summary: string;
  };
  providerCallId?: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  l2Resolvable: boolean;
};

export type Manual = {
  id: string;
  title: string;
  summary: string;
  status: "activo" | "pendiente_cliente";
  updatedAt: string;
  sections: { heading: string; body: string }[];
};

export type ScriptStep = {
  id: string;
  title: string;
  text: string;
  proactive?: boolean;
};

export type Script = {
  id: string;
  name: string;
  scenario: string;
  steps: ScriptStep[];
};

export type ProtocolStep = {
  id: string;
  title: string;
  detail: string;
  required: boolean;
};

export type EscalationRule = {
  id: string;
  when: string;
  destination: string;
  slaMinutes: number;
};

export type Protocol = {
  id: string;
  name: string;
  version: string;
  source: "plantilla" | "cliente";
  description: string;
  steps: ProtocolStep[];
  rules: EscalationRule[];
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  extension: string;
  email: string;
  status: AgentStatus;
};

export type CrmEvent = {
  id: string;
  at: string;
  type: string;
  payload: Record<string, unknown>;
  target: string;
  delivered: boolean;
};

export type Settings = {
  clientName: string;
  lineNumber: string;
  telephony: {
    provider: "pendiente" | "twilio" | "telnyx" | "sip";
    status: "awaiting_client" | "conectado" | "error";
    inboundWebhook: string;
  };
  crm: {
    mode: "nativo" | "externo";
    webhookUrl: string;
    apiEnabled: boolean;
  };
};

export type Store = {
  agents: Agent[];
  customers: Customer[];
  tickets: Ticket[];
  calls: Call[];
  faqs: Faq[];
  manuals: Manual[];
  scripts: Script[];
  protocols: Protocol[];
  settings: Settings;
  crmOutbox: CrmEvent[];
};

export type TriageResult = {
  category: TicketCategory;
  priority: TicketPriority;
  l2Resolvable: boolean;
  suggestEscalate: boolean;
  reason: string;
  faqIds: string[];
  scriptId?: string;
  destination?: string;
};
