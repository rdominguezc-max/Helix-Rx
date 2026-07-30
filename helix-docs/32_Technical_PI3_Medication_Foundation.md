# PI-3 - Medication Foundation

**Proyecto:** helix

**Estado:** Implementado y validado en runtime local

**Fecha:** 30 de julio de 2026

---

# Objetivo

Establecer la primera frontera DDD del Treatment Intelligence Engine sin
confundir tres conceptos distintos:

* medicamento clinico;
* presentacion comercial;
* prescripcion o tratamiento del paciente.

# Modelo

## Medication

Concepto clinico y catalogable:

* nombre generico;
* sustancia activa;
* forma farmaceutica;
* via de administracion;
* organizacion propietaria o catalogo global futuro.

## Medication Presentation

Producto comercial adquirido:

* marca y fabricante;
* concentracion y unidad;
* unidad administrable;
* cantidad por empaque;
* pais.

No almacena inventario del paciente.

## Patient Treatment

Instruccion prescrita para un paciente:

* medicamento;
* dosis y unidad;
* intervalo y horarios;
* inicio y fin;
* uso PRN;
* indicaciones;
* profesional que prescribe;
* estado.

No almacena recordatorios ni eventos de toma.

# API

Catalogo:

* `POST /api/v1/medications`
* `GET /api/v1/medications`
* `POST /api/v1/medications/:medicationId/presentations`
* `GET /api/v1/medications/:medicationId/presentations`

Tratamientos:

* `POST /api/v1/patients/:patientId/treatments`
* `GET /api/v1/patients/:patientId/treatments`

Permisos:

* `medications.read`
* `medications.write`

Los endpoints de tratamiento conservan la validacion de acceso al paciente,
relacion activa y consentimiento con scope de medicamentos.

# Persistencia

Migracion:

* `009_medication_foundation.sql`

Tablas:

* `medications`
* `medication_presentations`
* `patient_treatments`

# Validacion

* migracion `009` aplicada contra PostgreSQL 17;
* flujo medicamento -> presentacion -> tratamiento validado en una transaccion
  real;
* dosis de `1500 mg`, presentacion de `1000 mg` y horarios `07:00/19:00`
  persistieron y se leyeron correctamente;
* la transaccion de validacion termino con rollback y cero datos temporales;
* pruebas unitarias para normalizacion, agenda, tenant safety y auditoria;
* pruebas E2E para bloqueo por guard y creacion autorizada.

# Siguiente Incremento

**Dose Conversion And Patient Inventory**

Debe agregar:

* conversion de dosis prescrita a unidades administrables;
* soporte explicito de fracciones;
* compras y lotes;
* movimientos de inventario;
* cantidad disponible;
* fecha estimada de agotamiento.
