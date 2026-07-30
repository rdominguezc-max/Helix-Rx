# Sprint 1 - Auth HTTP Boundary / Guards Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Conectar solicitudes HTTP con `AuthService`, `AuthorizationService` y `AuditService`, manteniendo separadas autenticacion, autorizacion y auditoria.

---

# Separacion De Responsabilidades

Auth identifica.

Authorization decide.

Audit registra.

`AuthorizationService` sigue independiente de Firebase.

---

# Alcance

Incluye:

* Guard HTTP para Bearer Token.
* Extraccion de Firebase ID Token.
* Creacion de request context.
* Decorator `AuthenticatedUser`.
* Decorator `RequiredPermissions`.
* Guard de autorizacion basado en `AuthorizationService`.
* Auditoria basica de fallos y denegaciones.
* Manejo estandar de errores:
  * `401` no autenticado.
  * `403` no autorizado.
* Tests unitarios.

No incluye:

* Frontend.
* Pacientes.
* Medicamentos.
* Recordatorios.
* Expediente clinico.
* Funcionalidades clinicas.
* Endpoints clinicos.

---

# Request Context

`FirebaseBearerAuthGuard` agrega `authenticatedUser` al request:

* `userId`
* `firebaseUid`
* `email`
* `emailVerified`
* `organizationId`

`organizationId` se lee desde `x-organization-id` cuando aplique.

---

# Guards

## FirebaseBearerAuthGuard

Responsabilidades:

* Leer `Authorization: Bearer <token>`.
* Llamar `AuthService.authenticateFirebaseUser`.
* Agregar contexto autenticado al request.
* Registrar auditoria basica de fallos.
* Lanzar `UnauthorizedException` ante ausencia o fallo de autenticacion.

## PermissionsGuard

Responsabilidades:

* Leer permisos requeridos por metadata.
* Llamar `AuthorizationService.evaluate`.
* Registrar auditoria basica de denegaciones.
* Lanzar `ForbiddenException` ante decision `DENY`.

---

# Decorators

* `@AuthenticatedUser()`
* `@RequiredPermissions(...permissions)`

---

# Auditoria

Eventos preparados:

* `auth.http.authenticate` con `failure`.
* `auth.http.authorize` con `denied`.

No se implementa auditoria automatica global en esta entrega.

---

# Riesgos

* `organizationId` via header es suficiente para preparar la frontera, pero debera endurecerse cuando existan rutas/tenancy reales.
* No hay endpoints publicos aun para probar flujo HTTP end-to-end.
* Guards aun no estan registrados globalmente ni aplicados a controladores.
* La relacion con paciente no se resuelve en esta frontera porque Patients no existe todavia.

---

# Siguiente Paso Recomendado

Implementar API Boundary Foundation con endpoints no clinicos minimos (`/me`, health extendido o contexto autenticado) para validar Auth + Guards sin introducir funcionalidades clinicas.
