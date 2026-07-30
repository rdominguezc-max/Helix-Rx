# PI-4 - Notification Delivery Foundation

**Proyecto:** helix

**Estado:** Implementado y validado

**Fecha:** 30 de julio de 2026

---

# Resultado

Se implemento la primera base del Reminder & Notification Engine:

* preferencias explicitas por paciente y organizacion;
* canales `push`, `email` y `sms`;
* anticipacion configurable del recordatorio;
* preparacion idempotente desde dosis esperadas;
* outbox neutral al proveedor;
* reclamacion concurrente con `FOR UPDATE SKIP LOCKED`;
* lease recuperable para trabajadores;
* token unico por reclamacion;
* ledger inmutable de entregas;
* cancelacion de trabajos pendientes al pausar preferencias;
* cancelacion de canales removidos;
* cancelacion del recordatorio cuando la dosis ya tiene resultado.
* destinos verificados con referencias opacas y etiquetas enmascaradas;
* permisos dedicados `notifications.read` y `notifications.write`.
* adaptador push real para Firebase Cloud Messaging;
* contenido push minimo sin identificadores del paciente ni datos clinicos.

# Alcance

La base puede enviar push mediante Firebase Cloud Messaging cuando las
credenciales Firebase estan configuradas. Las credenciales permanecen en el
entorno y no se almacenan en PostgreSQL.

El objetivo es separar:

1. la decision de que notificar;
2. la reclamacion segura del trabajo;
3. el adaptador del proveedor;
4. el resultado reportado por el proveedor.

# Preferencias

Cada paciente puede configurar:

* `enabledChannels`;
* `reminderLeadMinutes`, de 0 a 1440;
* estado `active` o `paused`.

La configuracion requiere que el paciente tenga membresia activa en la
organizacion.

# Trabajos

Tipo inicial:

* `dose_reminder`.

Estados:

* `pending`;
* `processing`;
* `sent`;
* `failed`;
* `cancelled`.

La combinacion dosis esperada, tipo, canal y destino es unica. Solo los destinos
activos y verificados producen trabajos; preparar la misma ventana no los duplica.

# Reclamacion

Un trabajador reclama hasta 100 trabajos vencidos. Cada reclamacion:

* bloquea filas con `SKIP LOCKED`;
* genera un `claimToken`;
* registra trabajador y fecha;
* incrementa intentos;
* establece un lease de 30 a 3600 segundos.

Un trabajo `processing` puede reclamarse de nuevo cuando vence el lease.

# Entregas

Estados reportables:

* `accepted`;
* `delivered`;
* `failed`.

Cada evento conserva proveedor, identificador externo opcional, error y fecha.
Una entrega solo se acepta con un token de reclamacion activo. El token no puede
reutilizarse despues de finalizar el trabajo.

# API

* `PUT /api/v1/patients/:patientId/notifications/preference`
* `GET /api/v1/patients/:patientId/notifications/preference`
* `POST /api/v1/patients/:patientId/notifications/destinations`
* `GET /api/v1/patients/:patientId/notifications/destinations`
* `POST /api/v1/patients/:patientId/notifications/destinations/:destinationId/verify`
* `POST /api/v1/patients/:patientId/notifications/destinations/:destinationId/revoke`
* `POST /api/v1/patients/:patientId/notifications/jobs/prepare`
* `POST /api/v1/patients/:patientId/notifications/jobs/claim`
* `POST /api/v1/patients/:patientId/notifications/jobs/:notificationJobId/deliveries`

Estos endpoints usan `notifications.read` y `notifications.write`.

# Persistencia

Migracion:

* `013_notification_delivery_foundation.sql`
* `014_verified_notification_destinations.sql`

Tablas:

* `patient_notification_preferences`;
* `notification_jobs`;
* `notification_delivery_events`.
* `patient_notification_destinations`.

# Seguridad De Escalamiento

No se implemento escalamiento automatico a contactos de emergencia. El modelo
actual permite indicar `can_receive_alerts`, pero no vincula el contacto con un
consentimiento de notificaciones verificable.

Antes de notificar a terceros se requiere:

* identidad estable del destinatario;
* canal y destino verificados;
* consentimiento activo con scope de notificaciones;
* reglas de revocacion;
* auditoria del motivo de escalamiento.

# Validacion

PostgreSQL 17 valido:

* migraciones `013` y `014`;
* preferencias con membresia;
* preparacion multicanal;
* deduplicacion;
* reclamacion con lease;
* registro de entrega;
* rechazo de token reutilizado;
* limpieza completa de datos temporales.

CI aprobo:

* lint;
* typecheck;
* build;
* 37 archivos de pruebas;
* 135 pruebas.

# Siguiente Incremento

**Worker Push Y Reintentos**

Debe incluir:

* resolver referencias opacas hacia tokens fuera de PostgreSQL;
* trabajador programado para reclamar y enviar push;
* reintentos con backoff y limite;
* webhooks idempotentes del proveedor;
* modelo verificable de consentimiento para terceros.
