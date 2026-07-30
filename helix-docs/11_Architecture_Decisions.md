# Architecture Decisions

**Proyecto:** helix

**Versión:** 1.0

**Estado:** Activo

**Fecha:** 28 de junio de 2026

---

# Objetivo

Registrar las decisiones de arquitectura aprobadas para guiar el desarrollo de helix.

Este documento representa las decisiones técnicas oficiales del proyecto y complementa la documentación funcional.

Toda decisión importante de arquitectura deberá quedar registrada aquí antes de implementarse.

---

# AD-001 — Monolito Modular para el MVP

## Decisión

helix utilizará **NestJS** como un **Monolito Modular** durante el MVP.

No se implementarán microservicios físicos durante esta etapa.

Cada dominio será desarrollado como un módulo independiente con límites claramente definidos, preparado para una posible extracción futura cuando exista una necesidad real de escalabilidad, autonomía operativa o integración.

### Justificación

* Reduce complejidad.
* Facilita el desarrollo.
* Simplifica las pruebas.
* Disminuye costos.
* Evita sobrearquitectura.
* Permite evolucionar a microservicios sin reescribir el sistema.

---

# AD-002 — Plataforma SaaS Multi-Tenant

## Decisión

helix será construido como una plataforma **SaaS Multi-Tenant**.

Toda la arquitectura deberá soportar múltiples organizaciones utilizando aislamiento lógico mediante `organization_id`.

Cada organización podrá administrar sus propios usuarios, médicos, asistentes, pacientes y permisos.

### Justificación

Este modelo permitirá soportar:

* Pacientes individuales.
* Médicos independientes.
* Clínicas.
* Hospitales.
* Aseguradoras.
* Programas corporativos.

---

# AD-003 — PostgreSQL como Fuente Oficial de Datos

## Decisión

Cloud SQL con PostgreSQL será la única fuente oficial de información transaccional.

Se almacenarán en PostgreSQL:

* Usuarios.
* Organizaciones.
* Roles.
* Permisos.
* Pacientes.
* Expedientes.
* Medicamentos.
* Confirmaciones.
* Auditoría.
* Relaciones.

### Justificación

* Mayor consistencia.
* Mejor integridad.
* Facilidad de auditoría.
* Menor riesgo de inconsistencias.

---

# AD-004 — Uso Controlado de Firestore

## Decisión

Firestore se utilizará únicamente cuando aporte ventajas claras para información dinámica.

Ejemplos:

* Notificaciones.
* Estados temporales.
* Mensajería.
* Cachés.
* Eventos en tiempo real.

Nunca será la fuente oficial de datos clínicos.

---

# AD-005 — BigQuery Diferido

## Decisión

BigQuery no formará parte del MVP.

Será incorporado cuando exista suficiente volumen de información para analítica poblacional y modelos de inteligencia artificial.

### Justificación

Evitar complejidad y costos prematuros.

---

# AD-006 — Progressive Web App (PWA)

## Decisión

La primera versión del producto será una **Progressive Web App (PWA)**.

La experiencia será diseñada bajo el principio **Mobile First**.

Las aplicaciones nativas para Android e iOS se desarrollarán únicamente cuando el producto esté validado.

### Justificación

* Menor costo.
* Menor tiempo de desarrollo.
* Una sola base de código.
* Actualizaciones más rápidas.

---

# AD-007 — Clean Architecture

## Decisión

Toda la plataforma deberá respetar los siguientes principios:

* Clean Architecture.
* SOLID.
* API First.
* Dependency Injection.
* Repository Pattern.
* Separación de responsabilidades.

Las reglas de negocio nunca deberán implementarse en el frontend.

---

# AD-008 — Seguridad Basada en Roles y Relaciones

## Decisión

La autorización combinará:

* RBAC (Role-Based Access Control).

y

* Relationship-Based Access.

Un usuario no podrá consultar información clínica únicamente por su rol.

Siempre deberá existir una relación autorizada entre:

* Médico ↔ Paciente.
* Familiar ↔ Paciente.
* Cuidador ↔ Paciente.
* Organización ↔ Usuario.

Además deberá existir consentimiento vigente cuando corresponda.

---

# AD-009 — Auditoría Clínica

## Decisión

Toda acción sensible deberá registrarse.

La auditoría será independiente de los logs técnicos.

Cada registro deberá incluir:

* Usuario.
* Organización.
* Acción.
* Fecha.
* Dirección IP.
* Entidad afectada.
* Resultado.

---

# AD-010 — Documentación como Fuente Oficial

## Decisión

La documentación será la única fuente oficial de verdad del proyecto.

Toda funcionalidad deberá documentarse antes de desarrollarse.

Las decisiones de arquitectura deberán registrarse antes de implementarse.

---

# AD-011 — Observabilidad Funcional

## Decisión

Además de las métricas técnicas, helix registrará eventos funcionales desde el primer Sprint.

Ejemplos:

* Usuario registrado.
* Inicio de sesión.
* Medicamento creado.
* Recordatorio enviado.
* Recordatorio confirmado.
* Medicamento omitido.
* Crisis registrada.
* Dashboard médico consultado.

Estos eventos permitirán medir la adopción del producto, analizar el comportamiento de los usuarios y mejorar continuamente la plataforma.

No se recopilarán datos personales innecesarios ni información clínica con fines analíticos sin aplicar las medidas de privacidad correspondientes.

---

# AD-012 — Filosofía de Ingeniería

Toda decisión técnica deberá respetar el principio oficial del proyecto:

> **Be good, then fast.**

Primero construiremos soluciones correctas, seguras, mantenibles y escalables.

Después optimizaremos velocidad, rendimiento y nuevas funcionalidades.

Nunca sacrificaremos calidad por rapidez.

---

# Modificación de Decisiones

Toda modificación a este documento deberá:

1. Estar técnicamente justificada.
2. Ser aprobada por el Product Owner.
3. Actualizar el archivo `10_CHANGELOG.md`.
4. Mantener alineación con la visión del proyecto siempre que sea posible.

---

# Estado

**Architecture Review v1:** Aprobado.

**Sprint 1:** Autorizado.

La implementación deberá realizarse por módulos, entregando resultados incrementales y esperando aprobación antes de continuar con el siguiente módulo.
