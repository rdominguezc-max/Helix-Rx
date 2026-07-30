# PI-2 - Patient Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

**Fecha:** 29 de junio de 2026

---

# Objetivo

Implementar la base del dominio Patient conforme a `25_Patient_Domain_Design.md`.

El modulo establece al paciente como Aggregate Root del dominio, separado de medicamentos, expediente clinico avanzado, crisis, recordatorios, frontend y Patient Timeline.

---

# Alcance Implementado

Incluye:

* Modulo `patients`.
* Aggregate Root `Patient`.
* Separacion conceptual `PatientIdentity` y `PatientProfile`.
* Entidades base:
  * `PatientOrganizationMembership`.
  * `PatientCareRelationship`.
  * `PatientEmergencyContact`.
  * `PatientInsuranceCoverage`.
  * `PatientConsent`.
  * `PatientReferenceIdentifier`.
* Evento oficial `PatientRegistered`.
* Repositorio PostgreSQL.
* Casos de uso internos:
  * `RegisterPatientUseCase`.
  * `FindPatientByIdUseCase`.
  * `UpdatePatientProfileUseCase`.
  * `AddEmergencyContactUseCase`.
  * `AddCareRelationshipUseCase`.
  * `AddConsentUseCase`.
* Auditoria en acciones sensibles de escritura.
* Tests unitarios.

No incluye:

* Medicamentos.
* Recordatorios.
* Crisis.
* Clinical Records avanzados.
* Patient Timeline.
* Frontend.
* Endpoints publicos.
* Firestore.

---

# Decisiones Tecnicas

## Patient Como Aggregate Root Delgado

`Patient` retorna identidad, perfil y membresia primaria activa.

Contactos, relaciones, consentimientos, seguros e identificadores existen como entidades del dominio, pero no se cargan como listas dentro del agregado para evitar un mega-agregado.

## Patient Identity Y Patient Profile

Se separan conceptualmente:

* `PatientIdentity`: vinculo opcional con `users.id`, referencia externa e identidad estable.
* `PatientProfile`: datos editables de perfil operativo.

La persistencia usa tablas separadas `patients` y `patient_profiles`.

## PatientOrganizationMembership

La relacion Patient-Organization se modela con `patient_organization_memberships`.

En MVP se permite una membresia primaria activa por paciente mediante indice unico parcial.

Esto prepara multiples organizaciones futuras sin acoplar permanentemente el paciente a una sola organizacion.

## Sin Endpoints Publicos

El modulo queda como foundation interna. Los endpoints publicos se deben crear en un modulo posterior cuando Authorization pueda consumir relaciones y consentimientos reales.

## Auditoria

Se registra auditoria para:

* `patient.create`.
* `patient.profile.update`.
* `patients.emergency_contact.add`.
* `patients.care_relationship.add`.
* `patients.consent.add`.

La metadata de auditoria no incluye payload clinico completo.

---

# Migracion

Migracion creada:

* `database/migrations/008_patient_foundation.sql`

Tablas creadas:

* `patients`
* `patient_profiles`
* `patient_organization_memberships`
* `patient_care_relationships`
* `patient_emergency_contacts`
* `patient_insurance_coverages`
* `patient_consents`
* `patient_reference_identifiers`

Restricciones relevantes:

* Status validos para pacientes.
* Perfil unico activo por paciente.
* Membresia activa unica por paciente-organizacion.
* Una membresia primaria activa por paciente.
* Relacion de cuidado activa unica por paciente, organizacion, usuario y tipo.
* Un seguro primario activo por paciente.
* Foreign keys hacia `users` y `organizations`.

---

# Integracion Con Sprint 1

El modulo usa:

* `AuditService` para registrar acciones sensibles.
* `DatabaseService` con soporte de transacciones.
* `users` para vinculo opcional `user_id`.
* `organizations` para membresia organizacional.

No modifica Auth, Authorization ni Guards.

La integracion futura con Authorization debera consultar:

* `patient_organization_memberships`.
* `patient_care_relationships`.
* `patient_consents`.

---

# Pruebas

Pruebas agregadas:

* Registro de paciente con normalizacion y auditoria.
* Rechazo de fecha de nacimiento futura.
* Busqueda por id.
* Actualizacion de perfil con membresia activa.
* Rechazo de actualizacion sin membresia activa.
* Alta de contacto de emergencia.
* Alta de relacion de cuidado con scopes normalizados.
* Alta de consentimiento con scopes para futura autorizacion.

---

# Riesgos Encontrados

* Las migraciones no fueron validadas contra PostgreSQL real en este entorno.
* La estrategia legal para multiples organizaciones por paciente aun requiere aprobacion por flujo de negocio antes de permitir mas de una membresia activa.
* Consentimientos quedan modelados, pero aun no son consumidos por Authorization Foundation.
* No existe todavia Patient Timeline ni proyecciones longitudinales.
* La auditoria actual registra acciones de escritura; lectura sensible debera definirse cuando existan endpoints publicos.

---

# Siguiente Modulo Recomendado

**Patient Authorization Integration Foundation**

Objetivo recomendado:

Conectar Authorization Foundation con `patient_organization_memberships`, `patient_care_relationships` y `patient_consents` para que las decisiones `ALLOW`/`DENY` usen relaciones reales del dominio Patient.

No se recomienda implementar medicamentos, crisis o recordatorios antes de cerrar esta integracion de autorizacion clinica.
