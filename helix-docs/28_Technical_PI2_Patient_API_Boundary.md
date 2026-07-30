# PI-2 - Patient API Boundary Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

**Fecha:** 29 de junio de 2026

---

# Objetivo

Crear endpoints minimos de Patient protegidos con Auth y Authorization para validar el circuito:

Auth -> Context -> Authorization -> Patient -> Audit.

---

# Endpoints Creados

## `POST /api/v1/patients`

Registra un paciente dentro de la organizacion autenticada.

Proteccion:

* `FirebaseBearerAuthGuard`.
* `PermissionsGuard`.
* Permiso requerido: `patients.write`.
* `PatientAccessRequired(false)` porque el paciente aun no existe.

Auditoria:

* `patient.create`.

## `GET /api/v1/patients/:patientId`

Consulta un paciente existente.

Proteccion:

* `FirebaseBearerAuthGuard`.
* `PermissionsGuard`.
* Permiso requerido: `patients.read`.
* Requiere `patientId`.
* Authorization valida relacion real y consentimiento vigente cuando aplica.

Auditoria:

* `patient.read`.

## `PATCH /api/v1/patients/:patientId/profile`

Actualiza perfil basico del paciente.

Proteccion:

* `FirebaseBearerAuthGuard`.
* `PermissionsGuard`.
* Permiso requerido: `patients.write`.
* Requiere `patientId`.
* Authorization valida relacion real y consentimiento vigente cuando aplica.

Auditoria:

* `patient.profile.update`.

---

# Decisiones Tecnicas

## Accion De Coleccion Para Crear Paciente

`POST /patients` no puede exigir relacion con paciente porque el paciente aun no existe.

Se agrego el decorator `PatientAccessRequired(false)` para marcar explicitamente acciones de coleccion. Authorization sigue validando membership activa, rol formal y permiso.

## Lectura Y Actualizacion Requieren Patient ID

`GET /patients/:patientId` y `PATCH /patients/:patientId/profile` pasan `patientId` desde ruta hacia Authorization mediante `PermissionsGuard`.

La autorizacion clinica usa:

* `patient_organization_memberships`.
* `patient_care_relationships`.
* `patient_consents`.

## Sin Endpoints Clinicos Avanzados

Esta entrega no agrega medicamentos, crisis, recordatorios, expediente avanzado, timeline ni frontend.

---

# Archivos Creados O Modificados

* `src/modules/patients/http/patients.controller.ts`
* `src/modules/patients/http/patient.dto.ts`
* `src/modules/patients/http/patients.controller.spec.ts`
* `test/patients.e2e.spec.ts`
* `src/modules/patients/patients.module.ts`
* `src/modules/auth/http/patient-access-required.decorator.ts`
* `src/modules/auth/http/http-auth.constants.ts`
* `src/modules/auth/http/authenticated-request-context.ts`
* `src/modules/auth/http/permissions.guard.ts`
* `src/modules/authorization/domain/authorization-request.ts`
* `src/modules/authorization/application/authorization.service.ts`
* `src/modules/authorization/application/authorization.service.spec.ts`

---

# Pruebas

Pruebas agregadas:

* Unitarias de `PatientsController`.
* HTTP basicas para rutas Patient protegidas.
* Authorization permite acciones de coleccion solo cuando `patientAccessRequired = false`.

---

# Riesgos Encontrados

* Firebase real no fue validado en este entorno.
* PostgreSQL real no fue usado para validar rutas end-to-end.
* Las acciones de lectura quedan auditadas en controlador; si despues se agregan mas endpoints de lectura deberan mantener esta disciplina.
* `organizationId` sigue llegando por contexto HTTP preparado en Sprint 1.

---

# Siguiente Modulo Recomendado

**Patient Relationships And Consent API Foundation**

Objetivo recomendado:

Exponer endpoints minimos para administrar relaciones de cuidado, contactos de emergencia y consentimientos con autorizacion y auditoria, antes de avanzar a medicamentos, crisis o recordatorios.
