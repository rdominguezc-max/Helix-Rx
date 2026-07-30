# PI-2 - Patient Authorization Integration Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

**Fecha:** 29 de junio de 2026

---

# Objetivo

Conectar Authorization Foundation con las relaciones reales del dominio Patient para que el acceso clinico dependa de:

* Organizacion.
* Membership activa del usuario.
* Rol formal.
* Permiso.
* Membresia activa del paciente en la organizacion.
* Relacion real con el paciente.
* Consentimiento vigente cuando aplique.

---

# Alcance Implementado

Incluye:

* Extension de `AuthorizationRequest` con `patientId`.
* Compatibilidad temporal con `patient.patientId`.
* Extension de `AuthorizationRepository` con `findPatientAccess`.
* Consulta PostgreSQL contra:
  * `patient_organization_memberships`.
  * `patient_care_relationships`.
  * `patient_consents`.
* Politica conservadora para permisos clinicos/paciente.
* Tests unitarios de escenarios permitidos y denegados.

No incluye:

* Medicamentos.
* Recordatorios.
* Crisis.
* Clinical Records avanzados.
* Patient Timeline.
* Frontend.
* Endpoints publicos clinicos.
* Firestore.

---

# Decisiones Tecnicas

## Patient ID Como Contexto Clinico

Los permisos sobre recursos clinicos requieren `patientId`.

Recursos patient-scoped:

* `patients`
* `medications`
* `appointments`
* `clinical_events`

Si falta `patientId`, Authorization responde `DENY`.

## Relacion Real, No Contexto Declarativo

La autorizacion ya no confia en una relacion enviada por el caller.

Para permisos clinicos, `AuthorizationService` consulta `AuthorizationRepository.findPatientAccess`, que valida relacion real en `patient_care_relationships`.

## Consentimiento

Para relaciones distintas de `self`, se requiere consentimiento activo.

Un consentimiento es vigente si:

* `status = active`.
* No esta eliminado.
* `effective_from <= now()`.
* `effective_to` es nulo o mayor/igual a `now()`.
* Fue concedido al usuario, a la organizacion o al subject user.
* El scope coincide con el permiso solicitado o su scope equivalente.

## Politica Conservadora

Authorization responde `DENY` si:

* Input invalido.
* No existe membership activa del usuario.
* El rol no tiene el permiso.
* Falta `patientId` para permiso clinico.
* El paciente no tiene membresia activa en la organizacion.
* No existe relacion de cuidado activa.
* El consentimiento requerido no existe, esta revocado o esta expirado.

Authorization no lanza errores de permiso hacia capas superiores.

---

# Scopes De Consentimiento

Mapeo inicial:

* `patients.read` -> `profile.read`
* `patients.write` -> `profile.write`
* `medications.read` -> `medications.read`
* `medications.write` -> `medications.write`
* `appointments.read` -> `appointments.read`
* `appointments.write` -> `appointments.write`
* `clinical_events.read` -> `crisis_events.read` o `clinical_summary.read`
* `clinical_events.write` -> `crisis_events.write` o `clinical_summary.write`

Este mapeo es conservador y debera revisarse cuando se implementen dominios clinicos especificos.

---

# Archivos Modificados

* `src/modules/authorization/domain/authorization-request.ts`
* `src/modules/authorization/domain/authorization.repository.ts`
* `src/modules/authorization/domain/patient-relationship.ts`
* `src/modules/authorization/application/authorization-policy.ts`
* `src/modules/authorization/application/authorization.service.ts`
* `src/modules/authorization/infrastructure/postgres-authorization.repository.ts`
* `src/modules/authorization/application/authorization.service.spec.ts`
* `src/modules/authorization/application/evaluate-authorization.use-case.spec.ts`

---

# Pruebas

Escenarios cubiertos:

* Acceso permitido con relacion vigente y consentimiento activo.
* Acceso denegado sin contexto de paciente.
* Acceso denegado sin relacion real.
* Acceso denegado por consentimiento no activo.
* Acceso denegado por consentimiento expirado.
* Acceso denegado por organizacion incorrecta.
* Acceso no clinico sigue funcionando con RBAC.

---

# Riesgos Encontrados

* La consulta PostgreSQL no fue validada contra una base real en este entorno.
* Los scopes de consentimiento son iniciales y deben ajustarse por dominio clinico.
* La auditoria de lecturas clinicas dependera de los futuros endpoints o guards que llamen Authorization.
* La relacion `self` no exige consentimiento adicional, pero si requiere relacion real activa.

---

# Siguiente Modulo Recomendado

**Patient API Boundary Foundation**

Objetivo recomendado:

Crear endpoints minimos no avanzados de Patient protegidos por Auth y PermissionsGuard para validar el circuito completo:

* Auth identifica.
* Authorization decide usando relacion y consentimiento real.
* Audit registra.

No se recomienda iniciar medicamentos, crisis o recordatorios antes de validar esta frontera clinica minima.
