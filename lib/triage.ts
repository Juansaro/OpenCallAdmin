import type { Faq, TicketCategory, TicketPriority, TriageResult } from "./types";

type Rule = {
  pattern: RegExp;
  category: TicketCategory;
  priority: TicketPriority;
  l2Resolvable: boolean;
  suggestEscalate: boolean;
  reason: string;
  destination?: string;
  scriptId?: string;
};

const RULES: Rule[] = [
  {
    pattern: /503|ca[ií]da|no funciona|producci[oó]n|cr[ií]tico|varios usuarios/i,
    category: "incidencia",
    priority: "critica",
    l2Resolvable: false,
    suggestEscalate: true,
    reason: "Impacto de servicio. Completar filtrado L2 y escalar según la matriz.",
    destination: "L3 · Plataforma",
  },
  {
    pattern: /sincroniz|error|falla|bug|integraci[oó]n/i,
    category: "incidencia",
    priority: "alta",
    l2Resolvable: false,
    suggestEscalate: true,
    reason: "Incidencia técnica: diagnosticar y, si no hay procedimiento L2, escalar.",
    destination: "Ingeniería / Integraciones",
  },
  {
    pattern: /contrase[ñn]a|password|acceso|login|bloque/i,
    category: "acceso",
    priority: "media",
    l2Resolvable: true,
    suggestEscalate: false,
    reason: "Acceso: hay procedimiento L2 de recuperación.",
    scriptId: "SCR-2",
  },
  {
    pattern: /factura|cargo|cobro|pago|duplicad/i,
    category: "facturacion",
    priority: "media",
    l2Resolvable: true,
    suggestEscalate: false,
    reason: "Facturación estándar. Escalar a Finanzas solo si el desglose no explica el cargo.",
    destination: "Finanzas",
  },
  {
    pattern: /invitar|usuario|onboarding|c[oó]mo/i,
    category: "consulta",
    priority: "baja",
    l2Resolvable: true,
    suggestEscalate: false,
    reason: "Consulta frecuente. Resolver con FAQ y dejar resumen proactivo.",
    scriptId: "SCR-1",
  },
];

export function matchFaqs(text: string, faqs: Faq[]): Faq[] {
  const haystack = text.toLowerCase();
  return faqs
    .map((faq) => {
      const score = faq.keywords.reduce(
        (acc, kw) => (haystack.includes(kw.toLowerCase()) ? acc + 1 : acc),
        faq.question.toLowerCase().split(" ").some((w) => w.length > 4 && haystack.includes(w))
          ? 1
          : 0,
      );
      return { faq, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.faq);
}

export function classifyIncident(text: string, faqs: Faq[] = []): TriageResult {
  const trimmed = text.trim();
  const rule = RULES.find((r) => r.pattern.test(trimmed));
  const matchedFaqs = matchFaqs(trimmed, faqs);
  if (!rule) {
    return {
      category: "consulta",
      priority: "media",
      l2Resolvable: true,
      suggestEscalate: false,
      reason: "Sin coincidencia fuerte. Tratar como consulta L2 y documentar en el CRM.",
      faqIds: matchedFaqs.map((f) => f.id),
      scriptId: "SCR-1",
    };
  }
  const l2Resolvable = rule.l2Resolvable && !matchedFaqs.some((f) => !f.l2Resolvable);
  const rank = { baja: 0, media: 1, alta: 2, critica: 3 };
  let priority = rule.priority;
  if (matchedFaqs.some((f) => !f.l2Resolvable) && rank[priority] < 2) {
    priority = "alta";
  }
  return {
    category: rule.category,
    priority,
    l2Resolvable,
    suggestEscalate: rule.suggestEscalate || !l2Resolvable,
    reason: rule.reason,
    faqIds: matchedFaqs.map((f) => f.id),
    scriptId: rule.scriptId ?? "SCR-1",
    destination: rule.suggestEscalate || !l2Resolvable ? rule.destination : undefined,
  };
}
