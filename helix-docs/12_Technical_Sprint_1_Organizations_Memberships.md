# Sprint 1 - Organizations + Memberships Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Preparar la base multi-tenant de helix antes de implementar usuarios, roles y permisos.

---

# Alcance

Incluye:

* Modelo base de organizaciones.
* Modelo base de membresias.
* Relacion usuario-organizacion preparada mediante `user_id`.
* Migracion inicial SQL.
* Repositorios PostgreSQL.
* Casos de uso minimos.
* Validaciones de dominio.
* Tests unitarios.

No incluye:

* Frontend.
* Firebase Auth.
* Usuarios formales.
* Roles y permisos.
* Auditoria.
* Firestore.
* Pacientes.
* Medicamentos.
* Recordatorios.
* Expediente clinico.
* Funcionalidades clinicas.

---

# Decisiones Tecnicas

## Organizations

`organizations` representa el tenant logico de la plataforma.

Campos principales:

* `id`
* `name`
* `slug`
* `status`
* `created_at`
* `updated_at`
* `deleted_at`

El `slug` es unico para organizaciones activas no eliminadas.

---

## Memberships

`organization_memberships` representa la relacion entre un usuario y una organizacion.

`user_id` queda preparado como UUID, pero sin foreign key hasta que el modulo Users cree la tabla correspondiente.

Relaciones iniciales:

* `owner`
* `admin`
* `member`
* `medical_staff`
* `caregiver`

Estados iniciales:

* `active`
* `invited`
* `inactive`
* `suspended`

---

# Migraciones

Migracion creada:

* `database/migrations/001_create_organizations_and_memberships.sql`

La migracion crea:

* Extension `pgcrypto`.
* Tabla `organizations`.
* Tabla `organization_memberships`.
* Indices para slug, status, organization_id y user_id.
* Restriccion unica para membresia activa por organizacion y usuario.

---

# Repositorios

Repositorios creados:

* `PostgresOrganizationRepository`
* `PostgresMembershipRepository`

Los repositorios dependen de `DatabaseService`, no de acceso directo a `pg`.

---

# Casos de Uso

Casos de uso creados:

* `CreateOrganizationUseCase`
* `CreateMembershipUseCase`

No se expusieron endpoints HTTP porque Auth, RBAC y autorizacion por relaciones aun no existen.

---

# Validaciones

Validaciones incluidas:

* Nombre de organizacion requerido y con longitud controlada.
* Slug normalizado a minusculas.
* Slug restringido a letras, numeros y guiones.
* UUID valido para `organizationId` y `userId`.
* Relacion de membresia dentro del catalogo permitido.
* Prevencion de slugs duplicados.
* Prevencion de membresias activas duplicadas.

---

# Siguiente Paso Recomendado

Implementar Users Foundation para crear la tabla formal de usuarios internos y despues agregar la foreign key desde `organization_memberships.user_id` hacia `users.id`.
