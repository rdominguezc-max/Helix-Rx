# PI-3 - Dose Conversion And Patient Inventory

**Proyecto:** helix

**Estado:** Implementado y validado en runtime local

**Fecha:** 30 de julio de 2026

---

# Resultado

Se implemento el segundo incremento del Treatment Intelligence Engine:

* conversion de dosis prescrita a unidades administrables;
* soporte decimal para cuartos, medios y dosis fraccionadas;
* lotes y compras de medicamento del paciente;
* ledger inmutable de movimientos;
* consumos y ajustes transaccionales;
* saldo posterior auditable;
* proyeccion de dias restantes y fecha estimada de agotamiento.

# Reglas

La conversion solo opera cuando la unidad prescrita y la unidad de
concentracion coinciden. La conversion entre `g`, `mg`, `mcg` u otras unidades
debera agregarse mediante una tabla explicita de conversiones, no con
suposiciones.

Ejemplo validado:

* dosis prescrita: `1500 mg`;
* presentacion: `1000 mg/tablet`;
* resultado: `1.5 tabletas por toma`;
* frecuencia: cada 12 horas;
* consumo diario: `3 tabletas`;
* inventario: `30 tabletas`;
* duracion estimada: `10 dias`.

# Persistencia

Migracion:

* `010_medication_inventory.sql`

Tablas:

* `patient_medication_inventory_lots`
* `medication_inventory_movements`

Cada compra crea un movimiento inicial. Cada administracion, desperdicio,
devolucion o ajuste registra un nuevo movimiento y actualiza el saldo dentro de
la misma transaccion con bloqueo de fila.

# API

* `POST /api/v1/patients/:patientId/medication-inventory`
* `GET /api/v1/patients/:patientId/medication-inventory`
* `POST /api/v1/patients/:patientId/medication-inventory/:inventoryLotId/movements`
* `POST /api/v1/medications/dose-conversion`
* `POST /api/v1/medications/inventory-projection`

# Seguridad

Los recursos del paciente requieren:

* organizacion activa;
* permiso `medications.read` o `medications.write`;
* relacion activa con el paciente;
* consentimiento vigente con scope de medicamentos.

# Validacion

PostgreSQL 17 valido:

* compra de `30` tabletas;
* consumo de `1.5`;
* saldo final `28.5`;
* dos movimientos con suma de ledger `28.5`;
* rollback completo y cero datos temporales.

CI:

* lint aprobado;
* typecheck aprobado;
* build aprobado;
* `31` archivos de pruebas aprobados;
* `98` pruebas aprobadas.

# Siguiente Incremento

**Treatment Lifecycle And Automatic Consumption**

Debe incluir:

* pausar, completar y descontinuar tratamientos;
* seleccionar lotes por FEFO;
* consumir automaticamente al confirmar una dosis;
* impedir consumo duplicado;
* eventos de toma como fuente de adherencia;
* alertas de inventario bajo y caducidad.
