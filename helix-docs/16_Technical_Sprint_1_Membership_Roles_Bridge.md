# Sprint 1 - Membership Roles Bridge

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Conectar `organization_memberships` con los roles formales definidos en `roles`, preparando la base real de RBAC multi-tenant antes de implementar Auth o guards.

---

# Alcance

Incluye:

* Campo `role_id` en `organization_memberships`.
* Foreign key hacia `roles.id`.
* Migracion de relaciones heredadas a roles formales.
* Actualizacion de entidad `OrganizationMembership`.
* Actualizacion de repositorio PostgreSQL de memberships.
* Actualizacion de `CreateMembershipUseCase`.
* Validacion de rol formal existente.
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

---

# Mapeo de Relaciones Heredadas

Mapeo aprobado en esta entrega:

* `owner` -> `organization_owner`
* `admin` -> `organization_admin`
* `medical_staff` -> `medical_assistant`
* `caregiver` -> `caregiver`
* `member` -> `patient`

## Justificacion de `medical_staff`

`medical_staff` era una relacion generica de personal clinico. Se mapea a `medical_assistant` porque es la opcion mas conservadora: no presume que la persona es medico tratante ni otorga permisos completos de `physician`.

Si el flujo posterior identifica al usuario como medico, se debera asignar explicitamente el rol `physician`.

## Justificacion de `member`

`member` se mapea a `patient` porque no existe un rol generico sembrado y el permiso mas limitado dentro del modelo actual es el de paciente.

Si en el futuro se requiere un miembro organizacional sin contexto clinico, se debera crear un rol formal especifico antes de asignarlo.

---

# Compatibilidad Temporal

Se conserva el campo `relationship` como clasificacion semantica heredada y para compatibilidad temporal.

La autorizacion formal futura debera usar `role_id`.

No se elimina `relationship` en esta entrega para evitar una migracion destructiva y porque aun no existen Auth, guards ni pantallas administrativas que permitan revisar asignaciones.

---

# Role Code Explicito

`CreateMembershipUseCase` permite recibir `roleCode` explicito.

Si `roleCode` no se proporciona, el caso de uso deriva el rol formal desde `relationship` usando el mapeo aprobado.

Si `roleCode` se proporciona, el caso de uso valida que el rol formal exista y usa ese rol para crear la membresia.

Esta capacidad queda preparada para futuras pantallas administrativas o flujos internos donde se deba asignar un rol formal distinto al mapeo por defecto.

---

# Migracion

Migracion creada:

* `database/migrations/005_membership_roles_bridge.sql`

La migracion:

* Agrega `role_id`.
* Rellena `role_id` segun el mapeo heredado.
* Marca `role_id` como obligatorio.
* Agrega FK hacia `roles.id`.
* Agrega indice activo por rol.
* Documenta columnas con comentarios SQL.

---

# Siguiente Paso Recomendado

Implementar RBAC Query Foundation para consultar permisos efectivos por membership antes de crear Auth, JWT o guards.
