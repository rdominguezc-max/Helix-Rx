# Sprint 1 - Roles Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Crear la base formal de roles y su relacion con permisos para habilitar RBAC posteriormente.

---

# Alcance

Incluye:

* Tabla `roles`.
* Tabla `role_permissions`.
* Entidad de dominio `Role`.
* Relacion de dominio `RolePermission`.
* Repositorio PostgreSQL.
* Casos de uso minimos:
  * create role
  * find role by id
  * find role by code
  * assign permission to role
  * list permissions by role
* Validaciones de codigo, nombre, status y UUID.
* Semilla de roles iniciales.
* Asignacion inicial conservadora de permisos.
* Tests unitarios.

No incluye:

* Firebase Authentication.
* JWT.
* Login.
* Endpoints publicos.
* Frontend.
* Pacientes.
* Medicamentos.
* Funcionalidades clinicas.

---

# Roles Iniciales

Roles sembrados:

* `platform_admin`
* `organization_owner`
* `organization_admin`
* `physician`
* `medical_assistant`
* `caregiver`
* `patient`

---

# Asignacion Conservadora

La asignacion inicial de permisos es deliberadamente conservadora.

`platform_admin` recibe permisos operativos amplios.

Los roles de organizacion reciben permisos de lectura/escritura relacionados con organizaciones y membresias.

Los roles clinicos reciben permisos preparados de pacientes, medicamentos, agenda y eventos clinicos, pero estos permisos no habilitan modulos clinicos ni endpoints publicos todavia.

---

# Migraciones

Migracion creada:

* `database/migrations/004_create_roles_and_role_permissions.sql`

La migracion crea:

* Tabla `roles`.
* Tabla `role_permissions`.
* Indices activos por codigo, status, role y permission.
* Roles iniciales.
* Asignacion inicial de permisos.

---

# Decisiones Tecnicas

## Catalogo estable

Los roles se modelan como catalogo persistido en PostgreSQL para permitir auditoria, RBAC y administracion futura.

## Sin endpoints publicos

Los casos de uso existen internamente, pero no se exponen endpoints hasta implementar Auth, guards y autorizacion por relaciones.

## Relacion many-to-many

`role_permissions` permite asignar multiples permisos a multiples roles sin duplicacion activa.

---

# Siguiente Paso Recomendado

Implementar Membership Roles Bridge para relacionar membresias de organizacion con roles formales antes de conectar Firebase Auth y guards RBAC.
