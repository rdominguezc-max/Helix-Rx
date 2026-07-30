# Sprint 1 - Permissions Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Crear el catalogo oficial de permisos de helix antes de implementar roles, autenticacion o endpoints publicos.

---

# Alcance

Incluye:

* Tabla `permissions`.
* Entidad de dominio `Permission`.
* Repositorio PostgreSQL.
* Casos de uso minimos:
  * create permission
  * find permission by code
  * list active permissions
* Validaciones de formato.
* Migracion SQL.
* Catalogo inicial de permisos.
* Tests unitarios.
* Campos futuros de Auth agregados a `users`.

No incluye:

* Roles.
* Firebase Authentication.
* Login.
* JWT.
* Endpoints publicos.
* Frontend.

---

# Convencion de Permisos

Los permisos siguen la convencion:

`resource.action`

Ejemplos:

* `users.read`
* `users.write`
* `organizations.read`
* `organizations.write`
* `patients.read`
* `patients.write`
* `medications.read`
* `medications.write`

El formato permitido usa letras minusculas, numeros y guion bajo para cada parte.

---

# Catalogo Inicial

La migracion incluye permisos iniciales para:

* users
* organizations
* memberships
* permissions
* patients
* medications
* appointments
* clinical_events
* audit

Los permisos clinicos quedan preparados como catalogo, pero no habilitan funcionalidad clinica.

---

# Actualizacion de Users

La migracion agrega campos preparados para futuras fases:

* `firebase_uid` nullable.
* `email_verified`.
* `last_login_at`.
* `last_activity_at`.
* `preferred_locale`.

Firebase no queda habilitado en esta entrega.

---

# Migraciones

Migracion creada:

* `database/migrations/003_create_permissions_and_extend_users.sql`

La migracion crea:

* Tabla `permissions`.
* Indice unico activo por `code`.
* Indice por `resource` y `action`.
* Catalogo inicial de permisos.
* Columnas futuras en `users`.

---

# Siguiente Paso Recomendado

Implementar Roles Foundation para relacionar roles con permisos y preparar RBAC antes de Auth.
