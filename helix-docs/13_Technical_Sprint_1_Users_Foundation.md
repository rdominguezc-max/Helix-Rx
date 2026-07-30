# Sprint 1 - Users Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Crear la base interna de usuarios de helix en PostgreSQL y preparar la relacion usuario-organizacion antes de implementar Auth, RBAC y permisos formales.

---

# Alcance

Incluye:

* Tabla `users`.
* Entidad de dominio `User`.
* Repositorio PostgreSQL para users.
* Casos de uso minimos:
  * create user
  * find user by id
  * find user by email
  * update basic profile
* Validaciones de email, status, language y timezone.
* Migracion para agregar FK desde `organization_memberships.user_id` hacia `users.id`.
* Tests unitarios.

No incluye:

* Firebase Auth.
* Login.
* Roles y permisos formales.
* Endpoints publicos.
* Frontend.
* Pacientes.
* Medicamentos.
* Funcionalidades clinicas.

---

# Decisiones Tecnicas

## Usuario interno

`users` representa el usuario interno de helix.

Firebase Auth se integrara despues como proveedor de identidad. En esta fase no se agrega `firebase_uid` para evitar acoplar el dominio interno antes de cerrar el modulo Auth.

---

## Email unico

El email es unico para usuarios no eliminados mediante indice parcial:

`users_email_unique_active`

Esto permite soft delete sin bloquear permanentemente un email si el negocio define una politica de reutilizacion posterior.

---

## Language y timezone

`language` inicia con soporte para:

* `es`
* `en`

`timezone` se almacena como texto validado a nivel de aplicacion con formato compatible con identificadores IANA.

---

## Membership foreign key

La migracion `002_create_users_and_membership_fk.sql` agrega la FK:

`organization_memberships.user_id -> users.id`

Esto deja preparada la base relacional del modelo multi-tenant.

---

# Migraciones

Migracion creada:

* `database/migrations/002_create_users_and_membership_fk.sql`

La migracion crea:

* Tabla `users`.
* Indice unico activo por email normalizado.
* Indice por status.
* Foreign key desde memberships hacia users.

---

# Casos de Uso

Casos de uso creados:

* `CreateUserUseCase`
* `FindUserByIdUseCase`
* `FindUserByEmailUseCase`
* `UpdateBasicProfileUseCase`

No se exponen endpoints HTTP porque autenticacion, RBAC y autorizacion basada en relaciones todavia no existen.

---

# Siguiente Paso Recomendado

Implementar Roles + Permissions Foundation para definir permisos formales de plataforma antes de conectar Auth y exponer endpoints.
