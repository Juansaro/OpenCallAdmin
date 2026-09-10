# OpenCall Admin

Consola de **atención telefónica de nivel intermedio**. El agente atiende llamadas entrantes, resuelve dudas frecuentes, hace el filtrado inicial de incidencias y escala los casos complejos siguiendo un protocolo. Cada interacción se registra en un **CRM** para no perder contexto y para integrarlo después con el sistema del cliente.

El objetivo es mejorar la experiencia de quien llama y recortar el tiempo de respuesta: la consola sugiere FAQ, categoría y destino de escalado mientras se anota el caso, y el cierre de llamada pide una acción proactiva (resumen, callback, confirmación de acceso).

## Qué cubre este nivel

- Llamadas entrantes (softphone listo; la línea en la nube la conecta el cliente).
- Resolución de FAQ y consultas de producto, acceso y facturación estándar.
- Filtrado inicial: quién llama, impacto, desde cuándo, qué se intentó.
- Escalado con checklist obligatorio y matriz de destinos (L3, finanzas, integraciones).
- CRM de tickets (nativo) y bandeja de eventos para el CRM externo del cliente.
- Guiones base y hueco para los manuales de producto que entregará el cliente.

## Arranque

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Agente de demostración: Elena Vargas, extensión 204.

```bash
npm test
npm run build
```

## Cómo se enchufa el cliente

| Entrega del cliente | Dónde queda |
| --- | --- |
| Acceso a la línea telefónica en la nube | `POST /api/telephony/inbound` (Twilio, Telnyx o SIP genérico: `{ from, to, callSid }`) |
| Manuales de producto | Base de conocimiento → Manuales |
| Guiones propios | Página Guiones (hoy hay plantillas de apertura, acceso y escalado) |
| Protocolo de escalado | Página Protocolos (hoy hay plantilla L2) |
| CRM existente | Integraciones → modo webhook. Eventos `ticket.created`, `ticket.updated`, `ticket.escalated`, `ticket.resolved` |

Mientras no haya línea real, en la consola está **Simular llamada entrante**.

## API útil

- `GET /api/session` — agente, métricas y cola
- `POST /api/calls` — simula una llamada
- `POST /api/tickets` — alta en el CRM
- `POST /api/tickets/:id/escalate` — exige los pasos del protocolo
- `POST /api/triage` — `{ text }` → categoría, prioridad, FAQ y si se puede resolver en L2
- `GET /api/crm/events` — bandeja de integración

Los datos de demostración viven en `data/store.json` (se crea al primer arranque).
