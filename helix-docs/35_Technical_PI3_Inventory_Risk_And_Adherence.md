# PI-3 - Inventory Risk And Adherence Projections

**Proyecto:** helix

**Estado:** Implementado y validado

**Fecha:** 30 de julio de 2026

---

# Resultado

Se implemento una proyeccion por tratamiento que combina:

* adherencia sobre eventos de dosis registrados;
* puntualidad de dosis confirmadas;
* inventario compatible disponible;
* dosis restantes;
* dias estimados de cobertura;
* fecha estimada de agotamiento;
* siguiente fecha de caducidad;
* nivel de riesgo de desabasto;
* alertas por inventario bajo, agotado o proximo a caducar.

# API

`GET /api/v1/patients/:patientId/treatments/:treatmentId/insight`

Parametros opcionales:

* `windowDays`: ventana de adherencia, de 1 a 365 dias; default 30;
* `lowInventoryDays`: umbral de inventario bajo, de 1 a 90; default 7;
* `expirationWarningDays`: anticipacion de caducidad, de 1 a 365; default 30;
* `asOf`: instante de referencia reproducible.

# Adherencia

La adherencia registrada se calcula como:

`confirmed / (confirmed + omitted)`

Las dosis canceladas se reportan, pero no forman parte del denominador.

La puntualidad se calcula como:

`on_time / confirmed`

Cuando no existen eventos aplicables, el indicador es `null` y no cero.

## Limite Clinico

Esta version mide resultados registrados. No infiere dosis faltantes que nunca
fueron programadas como eventos. Un futuro scheduler debera materializar las
dosis esperadas para calcular adherencia contra el plan completo.

# Cobertura De Inventario

Solo se consideran lotes:

* del paciente y organizacion solicitados;
* vinculados al medicamento del tratamiento;
* con unidad de concentracion compatible;
* activos, no eliminados, con saldo positivo;
* vigentes en el instante `asOf`.

Las formulas son:

* cobertura prescrita = suma de `saldo * concentracion`;
* dosis restantes = `cobertura prescrita / dosis indicada`;
* dosis esperadas por dia = `24 / intervalo`, o cantidad de horarios;
* dias restantes = `dosis restantes / dosis esperadas por dia`.

Los tratamientos PRN, pausados o terminales conservan el conteo de dosis
disponibles, pero no reciben una duracion diaria inventada.

# Riesgo

Niveles:

* `critical`: no queda ninguna dosis compatible;
* `high`: quedan hasta 3 dias;
* `medium`: quedan mas de 3 dias, pero no superan el umbral configurado;
* `low`: la cobertura supera el umbral;
* `unknown`: no existe una frecuencia diaria determinista.

# Alertas

La respuesta puede incluir:

* `inventory_depleted`;
* `inventory_low`;
* `inventory_expiring`.

Las alertas son derivadas en tiempo real. No se persisten, evitando estados
obsoletos despues de una compra, consumo, pausa o cambio de fecha de consulta.

# Persistencia

No se agrego una migracion. La proyeccion reutiliza:

* `patient_treatments`;
* `medication_dose_events`;
* `patient_medication_inventory_lots`;
* `medication_presentations`.

Los indices existentes de las migraciones `009`, `010` y `011` cubren los
filtros por tratamiento, paciente, organizacion y estado.

# Validacion

PostgreSQL 17 acepto las consultas de tratamiento, agregacion de eventos e
inventario compatible.

CI aprobo:

* lint;
* typecheck;
* build;
* 33 archivos de pruebas;
* 116 pruebas.

# Siguiente Incremento

**Expected Dose Scheduling**

Debe materializar dosis esperadas a partir de frecuencia y horarios para:

* detectar dosis no registradas;
* calcular adherencia contra el plan completo;
* alimentar recordatorios;
* producir alertas de dosis vencida;
* separar omision declarada de ausencia de registro.
