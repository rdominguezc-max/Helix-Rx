# PI-3 - Expected Dose Scheduling

**Proyecto:** helix

**Estado:** Implementado y validado

**Fecha:** 30 de julio de 2026

---

# Resultado

Se implemento la materializacion de dosis esperadas para tratamientos
programados:

* generacion por horarios explicitos;
* generacion por intervalo de horas;
* conversion desde hora local a UTC con la zona IANA del paciente;
* ventanas limitadas a 90 dias;
* generacion idempotente;
* vinculacion automatica con confirmaciones, omisiones y cancelaciones;
* clasificacion de dosis vencidas sin resultado como `missed`;
* integracion de dosis sin registro al calculo de adherencia.

# Reglas

Los horarios explicitos tienen prioridad cuando el tratamiento tambien contiene
un intervalo.

Los tratamientos PRN no generan dosis esperadas. Los tratamientos pausados,
completados o descontinuados tampoco generan nuevas ocurrencias.

La fecha de inicio y la fecha final del tratamiento limitan la generacion.

La zona horaria proviene de `patient_profiles.timezone`. Si el perfil no esta
disponible, se utiliza `America/Hermosillo` como fallback de plataforma.

# Estados

Estados almacenados:

* `scheduled`;
* `fulfilled`;
* `cancelled`.

Estado derivado:

* `missed`: la tolerancia ya vencio y no existe resultado asociado.

`missed` se calcula al consultar para evitar procesos de escritura masiva y
para permitir diferentes tolerancias sin reescribir el historial.

# Adherencia Completa

El insight ahora reporta:

* `expectedDoses`;
* `confirmedDoses`;
* `omittedDoses`;
* `cancelledDoses`;
* `unrecordedDoses`.

La formula es:

`confirmed / (confirmed + omitted + unrecorded)`

Las cancelaciones se excluyen del denominador.

# API

Generar:

`POST /api/v1/patients/:patientId/treatments/:treatmentId/expected-doses/generate`

Listar:

`GET /api/v1/patients/:patientId/treatments/:treatmentId/expected-doses`

Campos y parametros:

* `windowStartsAt`;
* `windowEndsAt`;
* `asOf`;
* `missedGraceMinutes`, de 0 a 1440; default 60.

# Persistencia

Migracion:

* `012_expected_dose_scheduling.sql`

Tabla:

* `medication_expected_doses`

La restriccion unica por tratamiento y fecha garantiza idempotencia. Otra
restriccion unica impide vincular un evento clinico a mas de una dosis
esperada.

# Seguridad Y Auditoria

La generacion requiere `medications.write`; el listado requiere
`medications.read`. La generacion registra un evento de auditoria con ventana,
tratamiento, paciente, actor y cantidad creada.

# Validacion

PostgreSQL 17 valido:

* migracion `012`;
* conversion de `07:00 America/Hermosillo` a `14:00 UTC`;
* limites exactos de ventana;
* idempotencia;
* vinculacion con un evento existente;
* clasificacion de dosis vencidas como `missed`;
* limpieza completa de datos temporales.

CI aprobo:

* lint;
* typecheck;
* build;
* 35 archivos de pruebas;
* 125 pruebas.

# Siguiente Incremento

**Reminder And Notification Preparation**

Debe incluir:

* consulta eficiente de dosis proximas;
* reclamacion idempotente de trabajos de recordatorio;
* preferencias de notificacion;
* escalamiento autorizado a cuidadores;
* registro de entrega sin acoplarse a un proveedor especifico.
