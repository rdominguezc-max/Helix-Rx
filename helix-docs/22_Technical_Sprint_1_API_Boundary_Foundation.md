# Sprint 1 - API Boundary Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Crear endpoints minimos no clinicos para validar el circuito de autenticacion, contexto de usuario y auditoria, sin introducir funcionalidades clinicas.

---

# Alcance

Incluye:

* Endpoint protegido `GET /api/v1/me`.
* Uso de `FirebaseBearerAuthGuard`.
* Respuesta con perfil minimo del usuario autenticado.
* Contexto de organizacion cuando exista.
* Tests unitarios.
* Prueba HTTP basica.

No incluye:

* Pacientes.
* Medicamentos.
* Recordatorios.
* Expediente clinico.
* Frontend.
* Endpoints administrativos publicos.
* Funcionalidades clinicas.

---

# Endpoint `/me`

`GET /api/v1/me`

Requiere autenticacion valida.

Respuesta:

* `userId`
* `email`
* `language`
* `preferredLocale`
* `timezone`
* `organization`

`organization` es `null` si el request no trae contexto de organizacion.

---

# Seguridad

`/me` usa `FirebaseBearerAuthGuard`.

No usa `PermissionsGuard` porque consultar el perfil propio no requiere permisos clinicos ni administrativos.

Auth identifica.  
Authorization decide permisos cuando un endpoint los requiere.  
Audit registra fallos y denegaciones desde los guards.

---

# Health

`GET /api/v1/health` ya existe y se mantiene como endpoint no protegido.

---

# Errores

Errores preparados:

* `401` no autenticado desde `FirebaseBearerAuthGuard`.
* `403` no autorizado desde `PermissionsGuard` cuando aplique.

---

# Riesgos

* La prueba HTTP basica usa override de guard; no valida Firebase real.
* No hay entorno Docker/PostgreSQL disponible en este PowerShell para prueba integrada real.
* `organizationId` sigue llegando desde header preparado por la frontera HTTP.

---

# Siguiente Paso Recomendado

Completar infraestructura de CI/CD y Cloud Run preparado, o crear un endpoint no clinico adicional de contexto organizacional si se necesita validar tenancy antes del frontend.
