# Sprint 1 - Audit Log Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Crear la base de auditoria para registrar acciones sensibles del sistema antes de implementar Auth, Guards o endpoints publicos.

---

# Alcance

Incluye:

* Tabla `audit_logs`.
* Entidad de dominio `AuditLog`.
* Repositorio PostgreSQL.
* Caso de uso `RecordAuditEventUseCase`.
* Servicio interno `AuditService`.
* Validaciones de evento.
* Tests unitarios.

No incluye:

* Firebase Auth.
* JWT.
* Login.
* Endpoints publicos.
* Frontend.
* Pacientes.
* Medicamentos.
* Funcionalidades clinicas.
* Auditoria automatica en guards HTTP.

---

# Estructura Estandar Del Evento

Cada evento de auditoria contiene:

* `actor_user_id`
* `organization_id`
* `action`
* `resource_type`
* `resource_id`
* `result`
* `ip_address`
* `user_agent`
* `metadata`
* `created_at`

`actor_user_id` y `organization_id` son opcionales para permitir eventos pre-auth o eventos fallidos donde aun no exista identidad resuelta.

---

# Resultados

Resultados soportados:

* `success`
* `failure`
* `denied`

---

# Metadata

`metadata` se almacena como `jsonb`.

Regla importante:

No debe almacenarse informacion clinica sensible, secretos, tokens ni payloads completos en `metadata`.

Debe usarse solo para contexto operativo minimo.

---

# Migracion

Migracion creada:

* `database/migrations/006_create_audit_logs.sql`

La migracion crea:

* Tabla `audit_logs`.
* Indices por actor, organizacion, recurso, accion, resultado y fecha.
* Comentarios SQL para documentar intencion y restricciones de metadata.

---

# Integracion Futura

Cuando existan Auth y Guards:

1. Auth debera resolver `actor_user_id`.
2. Guards deberan registrar decisiones sensibles cuando corresponda.
3. Casos de uso de negocio deberan registrar acciones de creacion, actualizacion, denegacion y fallas relevantes.
4. La auditoria no debe depender directamente de Firebase ni JWT.

---

# Riesgos

* Sin Auth aun no se puede registrar actor real en todos los casos.
* Sin Guards no existe auditoria automatica de autorizacion.
* La migracion no fue validada contra PostgreSQL real porque Docker no esta disponible en este entorno.
* Se debe evitar que `metadata` se convierta en un contenedor de informacion sensible.

---

# Siguiente Paso Recomendado

Implementar Auth Foundation para integrar Firebase Authentication con usuarios internos, sin mezclar la logica de autorizacion ni auditoria con el proveedor externo.
