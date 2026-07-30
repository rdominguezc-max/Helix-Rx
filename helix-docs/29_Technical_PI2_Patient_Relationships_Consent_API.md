# PI-2 - Patient Relationships And Consent API Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

**Fecha:** 29 de junio de 2026

---

# Objetivo

Exponer endpoints minimos y seguros para administrar relaciones de cuidado, contactos de emergencia y consentimientos del paciente.

El objetivo es completar una frontera Patient basica antes de iniciar medicamentos, crisis, recordatorios o expediente clinico avanzado.

---

# Endpoints Creados

## Care Relationships

* `POST /api/v1/patients/:patientId/care-relationships`
* `GET /api/v1/patients/:patientId/care-relationships`

Permisos:

* Escritura: `patients.write`
* Lectura: `patients.read`

Auditoria:

* `patient.care_relationship.create`
* `patient.care_relationship.read`

## Emergency Contacts

* `POST /api/v1/patients/:patientId/emergency-contacts`
* `GET /api/v1/patients/:patientId/emergency-contacts`

Permisos:

* Escritura: `patients.write`
* Lectura: `patients.read`

Auditoria:

* `patient.emergency_contact.create`
* `patient.emergency_contact.read`

Decision importante:

Un contacto de emergencia no implica acceso clinico automatico. El endpoint solo crea `PatientEmergencyContact`; no crea `PatientCareRelationship`, no crea consentimiento y no otorga permisos.

## Consents

* `POST /api/v1/patients/:patientId/consents`
* `GET /api/v1/patients/:patientId/consents`

Permisos:

* Escritura: `patients.write`
* Lectura: `patients.read`

Auditoria:

* `patient.consent.create`
* `patient.consent.read`

Consentimiento incluye:

* `consentType`
* `scope`
* `status`
* `effectiveFrom`
* `effectiveTo`
* Usuario u organizacion destino cuando aplique.

---

# Proteccion

Todos los endpoints usan:

* `FirebaseBearerAuthGuard`
* `PermissionsGuard`

Todos los endpoints usan `patientId` desde la ruta.

Authorization valida:

* Usuario autenticado.
* Organizacion.
* Membership activa.
* Rol formal.
* Permiso.
* Relacion real con paciente.
* Consentimiento vigente cuando aplica.

---

# Decisiones Tecnicas

## Lecturas Como Proyecciones Simples

Las lecturas de relaciones, contactos y consentimientos son listas separadas. No se cargan dentro del Aggregate Root `Patient` para evitar convertir Patient en un mega-agregado.

## Tenant Safety

Las lecturas usan `patientId` y `organizationId`.

Para contactos de emergencia, que no tienen `organization_id`, el caso de uso valida primero que el paciente tenga membresia activa en la organizacion.

## Auditoria En Frontera Y Use Cases

Las acciones de escritura auditan en los use cases.

Las acciones de lectura auditan en el controller porque la lectura sensible ocurre en la frontera HTTP.

---

# Archivos Creados O Modificados

* `src/modules/patients/domain/patient.repository.ts`
* `src/modules/patients/infrastructure/postgres-patient.repository.ts`
* `src/modules/patients/application/list-care-relationships.use-case.ts`
* `src/modules/patients/application/list-emergency-contacts.use-case.ts`
* `src/modules/patients/application/list-consents.use-case.ts`
* `src/modules/patients/http/patient.dto.ts`
* `src/modules/patients/http/patients.controller.ts`
* `src/modules/patients/http/patients.controller.spec.ts`
* `src/modules/patients/application/patient-use-cases.spec.ts`
* `test/patients.e2e.spec.ts`

---

# Pruebas

Pruebas agregadas o ampliadas:

* Alta de relacion de cuidado.
* Alta de contacto de emergencia.
* Alta de consentimiento.
* Lectura de relaciones de cuidado.
* Lectura de contactos de emergencia.
* Lectura de consentimientos.
* Auditoria de lecturas.
* Prueba HTTP basica para endpoint protegido de contacto de emergencia.

---

# Riesgos Encontrados

* Las consultas PostgreSQL nuevas no fueron validadas contra base real en este entorno.
* La administracion de relaciones y consentimientos puede tener un problema de bootstrap si no existe todavia una relacion/consentimiento inicial para el primer administrador clinico.
* El modelo de scopes de consentimiento aun es inicial y debera refinarse por dominio clinico.
* No se implementa revocacion ni expiracion manual en API todavia.

---

# Siguiente Modulo Recomendado

**Patient Runtime Validation / Seed Path**

Objetivo recomendado:

Validar migraciones y crear una ruta controlada de seed o administracion interna para establecer la primera relacion/consentimiento de un paciente dentro de una organizacion antes de iniciar medicamentos.

Despues de eso, el siguiente dominio funcional recomendado seria **Medications Domain Design** o **Medication Foundation**, segun aprobacion del Product Owner.
