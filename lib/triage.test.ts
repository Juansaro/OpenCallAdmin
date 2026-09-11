import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyIncident } from "./triage.ts";
import type { Faq } from "./types.ts";

const faqs: Faq[] = [
  {
    id: "FAQ-4",
    question: "Error 503",
    answer: "...",
    category: "incidencia",
    keywords: ["503", "caída"],
    l2Resolvable: false,
  },
  {
    id: "FAQ-1",
    question: "Contraseña",
    answer: "...",
    category: "acceso",
    keywords: ["contraseña"],
    l2Resolvable: true,
  },
];

describe("classifyIncident", () => {
  it("resuelve accesos en L2 y sugiere el guion de recuperación", () => {
    const result = classifyIncident("No puedo entrar, olvidé la contraseña", faqs);
    assert.equal(result.category, "acceso");
    assert.equal(result.l2Resolvable, true);
    assert.equal(result.suggestEscalate, false);
    assert.equal(result.scriptId, "SCR-2");
    assert.ok(result.faqIds.includes("FAQ-1"));
  });

  it("escala caídas de servicio a L3", () => {
    const result = classifyIncident("Hay un 503 y no funciona para varios usuarios", faqs);
    assert.equal(result.suggestEscalate, true);
    assert.equal(result.l2Resolvable, false);
    assert.equal(result.destination, "L3 · Plataforma");
    assert.equal(result.priority, "critica");
  });

  it("trata texto genérico como consulta L2", () => {
    const result = classifyIncident("Quería saludar y pedir información general");
    assert.equal(result.category, "consulta");
    assert.equal(result.l2Resolvable, true);
  });
});
