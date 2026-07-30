# PI-3 - Treatment Lifecycle And Automatic Consumption

**Proyecto:** helix

**Estado:** Implementado y validado

**Fecha:** 30 de julio de 2026

---

# Resultado

Se implemento el tercer incremento del Treatment Intelligence Engine:

* transiciones auditables de tratamientos;
* pausa, reactivacion, finalizacion y descontinuacion;
* motivo obligatorio al descontinuar;
* registro de dosis confirmadas, omitidas y canceladas;
* clasificacion de puntualidad;
* consumo automatico de inventario al confirmar una dosis;
* asignacion de lotes por FEFO;
* soporte para consumir una dosis desde varios lotes;
* idempotencia para impedir eventos y consumos duplicados.

# Reglas De Ciclo De Vida

Transiciones permitidas:

* `draft` a `active` o `discontinued`;
* `active` a `paused`, `completed` o `discontinued`;
* `paused` a `active`, `completed` o `discontinued`;
* `completed` y `discontinued` son estados terminales.

Solo un tratamiento activo acepta eventos de dosis.

# Eventos De Dosis

Estados:

* `confirmed`: requiere `occurredAt` y consume inventario;
* `omitted`: requiere `omissionReason` y no consume inventario;
* `cancelled`: no consume inventario.

Una dosis confirmada se clasifica como:

* `early`: mas de 15 minutos antes;
* `on_time`: dentro de una ventana de 15 minutos;
* `late`: mas de 15 minutos despues.

# Consumo FEFO

Los lotes compatibles se bloquean y consumen dentro de una transaccion.
El orden de seleccion es:

1. fecha de caducidad mas proxima;
2. fecha de adquisicion;
3. identificador del lote.

Los lotes caducados, eliminados, agotados o con una unidad de concentracion
incompatible se excluyen. Si el inventario no cubre toda la dosis prescrita,
la transaccion falla sin registrar un consumo parcial.

# Persistencia

Migracion:

* `011_treatment_lifecycle_and_dose_events.sql`

Tablas:

* `patient_treatment_status_events`;
* `medication_dose_events`;
* `medication_dose_inventory_allocations`.

Cada asignacion vincula el evento clinico con el lote y el movimiento exacto
del ledger de inventario.

# API

* `PATCH /api/v1/patients/:patientId/treatments/:treatmentId/status`
* `POST /api/v1/patients/:patientId/treatments/:treatmentId/dose-events`
* `GET /api/v1/patients/:patientId/treatments/:treatmentId/dose-events`

# Seguridad Y Auditoria

Los endpoints requieren autenticacion, organizacion activa y permisos de
medicamentos. Los cambios de estado y los resultados de dosis registran
eventos de auditoria con paciente, tratamiento, actor y contexto HTTP.

# Validacion

PostgreSQL 17 valido la aplicacion de la migracion `011`.

CI aprobo:

* lint;
* typecheck;
* build;
* 33 archivos de pruebas;
* 109 pruebas.

La cobertura agregada verifica transiciones, motivos obligatorios,
confirmaciones, omisiones, auditoria, idempotencia y proteccion HTTP.

# Siguiente Incremento

**Inventory Risk And Adherence Projections**

Debe incluir:

* alertas por inventario bajo;
* alertas por caducidad;
* proyeccion actualizada despues de cada dosis;
* indicadores de adherencia por ventana temporal;
* riesgo de desabasto;
* preparacion para el motor de recordatorios.
