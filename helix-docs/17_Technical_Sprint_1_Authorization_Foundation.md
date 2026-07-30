# Sprint 1 - Authorization Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Disenar el motor interno de autorizacion que sera utilizado por toda la plataforma.

Este modulo es independiente de Firebase Authentication, JWT, login, endpoints HTTP y guards.

---

# Resultado

Toda evaluacion devuelve exclusivamente:

* `ALLOW`
* `DENY`

El motor no lanza errores de autorizacion hacia la capa superior. Ante datos invalidos, membresia ausente, rol sin permiso o falta de relacion requerida, responde `DENY`.

---

# Modelo de Autorizacion

La autorizacion evalua:

* Usuario.
* Organizacion.
* Membresia activa.
* Rol formal asignado por `role_id`.
* Permisos asociados al rol.
* Relacion con paciente cuando el permiso aplica a un recurso clinico/paciente.

---

# Entradas

`AuthorizationRequest` contiene:

* `userId`
* `organizationId`
* `permissionCode`
* `patient` opcional

`patient` contiene:

* `patientId`
* `relationship`

Relaciones de paciente preparadas:

* `self`
* `physician`
* `medical_assistant`
* `caregiver`

---

# Politica Inicial

El motor permite una accion solo si:

1. `userId` es valido.
2. `organizationId` es valido.
3. `permissionCode` tiene formato valido.
4. Existe una membresia activa para usuario y organizacion.
5. La membresia tiene un rol formal activo.
6. El rol tiene asignado el permiso activo.
7. Si el permiso es de alcance paciente/clinico, existe contexto de relacion con paciente.

Si cualquiera de estas condiciones falla, el resultado es `DENY`.

---

# Recursos Con Alcance Paciente

Los permisos de estos recursos requieren relacion con paciente cuando se autorizan sobre un paciente:

* `patients`
* `medications`
* `appointments`
* `clinical_events`

---

# Casos de Uso

Casos de uso creados:

* `EvaluateAuthorizationUseCase`

Servicio creado:

* `AuthorizationService`

Puerto de datos:

* `AuthorizationRepository`

Implementacion PostgreSQL:

* `PostgresAuthorizationRepository`

---

# Integracion Futura Con Auth y Guards

Cuando se implemente Firebase Auth/JWT:

1. Auth debera resolver la identidad externa hacia `users.id`.
2. El guard HTTP debera resolver `organizationId` desde ruta, header o contexto seguro.
3. El guard debera llamar `EvaluateAuthorizationUseCase`.
4. El guard solo debera transformar `ALLOW` en continuar y `DENY` en respuesta HTTP.
5. La autorizacion no debe depender directamente de Firebase ni JWT.

---

# Riesgos

* La relacion real con paciente aun no existe porque el modulo Patients no ha sido implementado.
* La politica paciente/clinica es conservadora y puede requerir refinamiento por flujo.
* Aun no existe auditoria de decisiones DENY/ALLOW.
* No se ha validado la consulta PostgreSQL en una base real porque Docker no esta disponible en este entorno.

---

# Siguiente Paso Recomendado

Implementar Audit Log Foundation antes de Auth para registrar acciones sensibles y preparar trazabilidad de autorizacion y cambios de negocio.
