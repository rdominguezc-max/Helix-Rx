# Patient Domain Design

**Proyecto:** helix

**Program Increment:** PI-2 - Patient Platform

**Documento:** 25_Patient_Domain_Design

**Estado:** Propuesto, pendiente de aprobacion

**Fecha:** 29 de junio de 2026

---

# 1. Vision Del Dominio Patient

El dominio Patient representa el nucleo funcional de helix: el sujeto de cuidado alrededor del cual se organizan la continuidad del tratamiento, las relaciones de cuidado, el consentimiento, la colaboracion familiar y profesional, y la futura experiencia clinica.

Patient no debe ser entendido como una tabla grande ni como un contenedor de toda la informacion clinica. Debe ser un dominio estable que responda una pregunta principal:

> Quien es la persona que recibe cuidado, bajo que organizacion/contexto se atiende, quienes pueden participar en su cuidado y bajo que consentimiento.

El paciente es el centro de helix, pero no todos los datos del paciente deben vivir dentro del agregado Patient.

El diseno debe permitir:

* Pacientes individuales usando helix directamente.
* Pacientes administrados por un medico independiente.
* Pacientes atendidos por una clinica.
* Pacientes compartidos con familiares y cuidadores.
* Pacientes que en el futuro puedan tener datos provenientes de hospitales, aseguradoras, laboratorios o integraciones FHIR/HL7.
* Crecimiento internacional, multiidioma y multizona horaria.
* Autorizacion basada en rol, relacion y consentimiento.
* Participacion futura de un mismo paciente en multiples organizaciones bajo reglas explicitas de membresia y consentimiento.
* Una futura linea de tiempo del paciente que concentre eventos relevantes para continuidad de cuidado, analitica e inteligencia artificial.

Principios aplicados:

* The patient comes first.
* Documentation before implementation.
* Be good, then fast.
* PostgreSQL como fuente oficial transaccional.
* Firestore no es fuente oficial de datos clinicos.
* Auth identifica.
* Authorization decide.
* Audit registra.

---

# 2. Objetivos Funcionales

El dominio Patient debe habilitar, como base funcional:

* Registrar un paciente dentro de una organizacion.
* Asociar opcionalmente un paciente con un usuario interno de helix.
* Separar conceptualmente la identidad estable del paciente de su perfil editable.
* Mantener datos personales basicos necesarios para continuidad de cuidado.
* Mantener estado operativo del paciente.
* Preparar una relacion Patient-Organization mediante membresia para soportar multiples organizaciones en el futuro.
* Registrar relaciones de cuidado con medicos, asistentes, familiares y cuidadores.
* Registrar contactos de emergencia.
* Registrar informacion basica de aseguradora o cobertura.
* Registrar consentimientos para compartir informacion y permitir acceso.
* Mantener configuracion personal del paciente: idioma, zona horaria, preferencias de comunicacion y accesibilidad.
* Emitir eventos de dominio para auditoria funcional e integracion futura.
* Emitir `PatientRegistered` como evento oficial del agregado al registrar un nuevo paciente.
* Servir como punto de entrada para dominios clinicos separados: medications, clinical records, appointments, crises, reminders y notifications.
* Preparar autorizacion por relacion con paciente sin depender de Firebase, JWT ni HTTP.

El dominio Patient no debe intentar resolver desde el inicio:

* Expediente clinico completo.
* Historial longitudinal multiinstitucional.
* Indice maestro de pacientes internacional.
* Motor de interoperabilidad FHIR/HL7.
* Reglas clinicas complejas.
* Algoritmos de riesgo o HELIX Score.
* Patient Timeline operativa.

Estas capacidades deben ser preparadas por diseno, no implementadas prematuramente dentro de Patient.

---

# 3. Bounded Context

## Nombre

Patient Platform / Patient Domain.

## Responsabilidad

Administrar la identidad operativa del paciente dentro de helix, su estado, sus relaciones de cuidado, sus consentimientos y sus preferencias personales.

## Limite Principal

Patient define quien es el paciente y quien tiene relacion autorizable con el.

Patient no define:

* Que medicamentos toma.
* Que diagnosticos tiene.
* Que crisis registro.
* Que recordatorios se enviaron.
* Que notificaciones recibio.
* Que citas tiene.
* Que documentos clinicos se adjuntaron.

Esos conceptos pertenecen a otros dominios y se relacionan con Patient mediante `patientId`.

## Regla De Oro

Si un dato describe la identidad, acceso, consentimiento, configuracion o red de cuidado del paciente, probablemente pertenece a Patient.

Si un dato describe tratamiento, evento clinico, agenda, documento, notificacion o calculo de riesgo, debe vivir en otro dominio.

---

# 4. Aggregate Root

## Aggregate Root Principal: `Patient`

`Patient` es el Aggregate Root del dominio.

Representa a una persona bajo cuidado dentro de un contexto organizacional de helix.

### Identidad

Campos conceptuales:

* `id`
* `primaryOrganizationId` o membresia activa principal en MVP
* `userId` opcional
* `externalReference` opcional
* `status`
* `identity`
* `profile`
* `personalSettings`
* `createdAt`
* `updatedAt`
* `deletedAt` opcional

### Separacion Patient Identity Y Patient Profile

El agregado debe separar conceptualmente:

* `PatientIdentity`: datos relativamente estables que ayudan a reconocer a la persona y vincularla con el sistema.
* `PatientProfile`: datos editables de perfil operativo, contacto y presentacion.

Esta separacion reduce acoplamiento porque la identidad puede requerir reglas de unicidad, verificacion, referencias externas o deduplicacion futura, mientras que el perfil puede cambiar con mayor frecuencia y bajo reglas de edicion menos estrictas.

En MVP pueden persistirse en una misma tabla si eso mantiene simple el monolito modular, pero el modelo de dominio debe tratarlos como conceptos distintos.

### Alcance Multi-Tenant

En el MVP, `Patient` puede operar con una sola organizacion activa, pero el diseno debe prepararse para multiples organizaciones mediante una entidad intermedia.

Modelo recomendado:

* `Patient` representa al sujeto de cuidado.
* `PatientOrganizationMembership` representa la relacion entre el paciente y una organizacion.
* En MVP debe existir una membresia activa principal por paciente.
* Toda consulta clinica debe filtrar por `organizationId` y validar membresia vigente del paciente en esa organizacion.
* Un usuario puede tener rol `patient` en una organizacion y estar vinculado con un `Patient`.
* Un paciente puede no tener usuario propio, por ejemplo cuando lo registra una clinica o un familiar.

Esto evita que `organizationId` quede incrustado como unica forma de pertenencia permanente y prepara escenarios futuros donde el paciente sea atendido por varias organizaciones con alcances distintos.

### Nota De Diseno A Largo Plazo

En una plataforma internacional, una misma persona podria tener registros en varias organizaciones. No se recomienda resolver esto con duplicacion agresiva ni con un identificador global obligatorio en MVP.

Recomendacion:

* MVP: una membresia Patient-Organization activa principal.
* Futuro cercano: multiples membresias Patient-Organization con status, scope, fechas y reglas de acceso.
* Futuro: introducir un dominio separado de `Person Identity`, `Patient Identity Resolution` o `Master Patient Index` si existe necesidad real de deduplicacion entre organizaciones.

Esto evita exponer datos entre tenants antes de tener reglas legales, consentimiento y gobernanza suficientes.

---

# 5. Entidades

## 5.1 Patient

Entidad raiz.

Responsabilidades:

* Crear paciente.
* Activar, suspender, archivar o marcar fallecido.
* Vincular o desvincular usuario interno cuando aplique.
* Administrar identidad conceptual del paciente.
* Actualizar perfil basico.
* Administrar membresia del paciente con organizacion.
* Actualizar configuracion personal.
* Administrar relaciones de cuidado.
* Administrar contactos de emergencia.
* Administrar informacion de seguro/cobertura.
* Administrar consentimientos.
* Emitir eventos de dominio.

No debe:

* Guardar lista completa de medicamentos.
* Guardar diagnosticos o notas clinicas completas.
* Guardar historial de crisis.
* Calcular HELIX Score.
* Enviar recordatorios o notificaciones.

## 5.2 PatientIdentity

Representa la identidad estable del paciente dentro de helix.

Campos conceptuales:

* `patientId`
* `userId` opcional
* `externalReference` opcional
* `referenceIdentifiers`
* `createdAt`
* `verifiedAt` opcional

Responsabilidades:

* Vincular el paciente con usuario interno cuando exista.
* Conservar identificadores de referencia externos o nacionales.
* Preparar deduplicacion futura sin imponer un identificador global en MVP.

Regla clave:

Patient Identity no debe depender de una sola organizacion como verdad permanente. La pertenencia organizacional debe modelarse mediante `PatientOrganizationMembership`.

## 5.3 PatientProfile

Representa datos editables de perfil operativo del paciente.

Campos conceptuales:

* `patientId`
* `name`
* `birthDate` opcional
* `administrativeSex` opcional
* `phone` opcional
* `email` opcional
* `country` opcional
* `bloodType` opcional
* `height` opcional
* `weight` opcional
* `updatedAt`

Responsabilidades:

* Mantener datos basicos necesarios para identificar al paciente en la operacion diaria.
* Permitir cambios controlados sin mezclar reglas de identidad, organizacion o consentimiento.

Regla clave:

El perfil no debe contener historial clinico longitudinal. Mediciones repetidas, observaciones clinicas y notas pertenecen a Clinical Records u Observations.

## 5.4 PatientOrganizationMembership

Representa la relacion entre un paciente y una organizacion.

Campos conceptuales:

* `id`
* `patientId`
* `organizationId`
* `status`
* `membershipType`
* `isPrimary`
* `startsAt`
* `endsAt` opcional
* `createdBy`
* `createdAt`
* `updatedAt`
* `revokedAt` opcional
* `revokedBy` opcional
* `revocationReason` opcional

Responsabilidades:

* Definir en que organizacion existe operativamente el paciente.
* Permitir que el MVP limite a una organizacion activa principal.
* Preparar multiples organizaciones futuras sin redisenar el agregado.

Reglas clave:

* En MVP debe existir maximo una membresia activa principal por paciente.
* En fases futuras podran existir multiples membresias activas si el Product Owner aprueba los flujos legales, operativos y de consentimiento.
* La autorizacion clinica debe validar que el paciente tenga membresia vigente en la organizacion usada como contexto.

## 5.5 PatientCareRelationship

Representa una relacion autorizable entre un paciente y un usuario.

Ejemplos:

* `self`
* `primary_physician`
* `covering_physician`
* `medical_assistant`
* `family_member`
* `caregiver`
* `emergency_contact`
* `organization_admin_viewer` solo si se justifica administrativamente

Campos conceptuales:

* `id`
* `patientId`
* `organizationId`
* `relatedUserId`
* `relationshipType`
* `status`
* `accessScope`
* `startsAt`
* `endsAt` opcional
* `createdBy`
* `createdAt`
* `updatedAt`
* `revokedAt` opcional
* `revokedBy` opcional
* `revocationReason` opcional

Regla clave:

Un rol por si solo no otorga acceso clinico. Para acceder a datos de paciente, debe existir relacion vigente y, cuando aplique, consentimiento vigente.

## 5.6 PatientEmergencyContact

Representa una persona o entidad que puede ser contactada en caso de emergencia.

Puede o no ser usuario de helix.

Campos conceptuales:

* `id`
* `patientId`
* `name`
* `relationshipLabel`
* `phone`
* `email` opcional
* `preferredLanguage` opcional
* `priority`
* `canReceiveAlerts`
* `notes` opcional
* `status`

Regla clave:

Ser contacto de emergencia no significa automaticamente tener acceso al expediente. El acceso requiere relacion autorizable y consentimiento.

## 5.7 PatientInsuranceCoverage

Representa informacion basica de seguro, plan o cobertura.

Campos conceptuales:

* `id`
* `patientId`
* `providerName`
* `policyNumber` opcional
* `groupNumber` opcional
* `planName` opcional
* `coverageType`
* `country`
* `validFrom` opcional
* `validTo` opcional
* `isPrimary`
* `status`
* `metadata` limitada

Regla clave:

Insurance en Patient debe ser identificacion/cobertura basica. Elegibilidad, reclamaciones, facturacion y autorizaciones de aseguradora pertenecen a dominios separados futuros.

## 5.8 PatientConsent

Representa un consentimiento otorgado, rechazado, revocado o expirado por el paciente o su representante autorizado.

Campos conceptuales:

* `id`
* `patientId`
* `organizationId`
* `subjectUserId` opcional
* `grantedToUserId` opcional
* `grantedToOrganizationId` opcional
* `consentType`
* `scope`
* `status`
* `effectiveFrom`
* `effectiveTo` opcional
* `capturedBy`
* `capturedAt`
* `revokedBy` opcional
* `revokedAt` opcional
* `revocationReason` opcional
* `source`
* `evidenceReference` opcional

Consentimientos iniciales sugeridos:

* `share_profile`
* `share_medications`
* `share_clinical_summary`
* `share_crisis_events`
* `share_appointments`
* `receive_notifications`
* `emergency_access`
* `caregiver_access`
* `physician_access`

Regla clave:

El consentimiento no sustituye RBAC. RBAC define capacidad general; relacion y consentimiento definen si esa capacidad aplica a ese paciente.

## 5.9 PatientPersonalSettings

Configuracion personal del paciente.

Puede modelarse como entidad o value object persistido con el paciente, segun implementacion final.

Campos conceptuales:

* `preferredLocale`
* `language`
* `timezone`
* `communicationPreferences`
* `accessibilityPreferences`
* `privacyPreferences`
* `reminderQuietHours` como preferencia, no como cola de recordatorios
* `measurementSystem`

Regla clave:

Settings define preferencias del paciente. La ejecucion de recordatorios y notificaciones pertenece a Reminder/Notification.

## 5.10 PatientReferenceIdentifier

Identificadores externos o nacionales cuando sean necesarios.

Ejemplos:

* CURP en Mexico.
* NSS en Mexico.
* MRN hospitalario.
* Identificador de aseguradora.
* FHIR Patient identifier futuro.

Campos conceptuales:

* `id`
* `patientId`
* `type`
* `value`
* `issuer`
* `country`
* `status`
* `verifiedAt` opcional

Regla clave:

No todos los paises usan los mismos identificadores. No deben hacerse obligatorios identificadores nacionales para crear un paciente.

---

# 6. Value Objects

Value Objects propuestos:

* `PatientId`
* `OrganizationId`
* `UserId`
* `PatientStatus`
* `PatientOrganizationMembershipId`
* `PatientOrganizationMembershipStatus`
* `PatientOrganizationMembershipType`
* `PersonName`
* `BirthDate`
* `AdministrativeSex`
* `GenderIdentity` opcional/futuro
* `PhoneNumber`
* `EmailAddress`
* `CountryCode`
* `LocaleCode`
* `Timezone`
* `PatientExternalReference`
* `BloodType`
* `Height`
* `Weight`
* `BMI` calculado, no capturado manualmente como verdad primaria
* `EmergencyContactPriority`
* `InsurancePolicyNumber`
* `ConsentScope`
* `ConsentStatus`
* `CareRelationshipType`
* `CareRelationshipStatus`
* `AccessScope`
* `DateRange`
* `AuditActor`

## Consideraciones

### BirthDate

Debe permitir validar edad, pero no debe asumir mayoria de edad uniforme en todos los paises. La logica legal de representantes debe ser configurable por region en fases posteriores.

### BloodType

Debe ser opcional y validado contra catalogo. Un dato desconocido no debe forzarse.

### Height, Weight y BMI

Altura y peso pueden ser datos clinicos cambiantes. Para MVP pueden existir como datos basicos opcionales, pero a largo plazo las mediciones longitudinales deben vivir en Clinical Records o Observations.

### Timezone

Debe existir a nivel paciente porque medicamentos y recordatorios dependen de la zona horaria del paciente, no necesariamente de la organizacion ni del usuario que consulta.

---

# 7. Objetos De Referencia

Objetos o catalogos de referencia que Patient puede consumir:

* Supported languages.
* Supported timezones.
* Countries.
* Relationship types.
* Patient statuses.
* Consent types.
* Consent scopes.
* Insurance coverage types.
* Communication channels.
* Accessibility preference types.
* Blood types.
* Administrative sex values.
* Organization types.
* Role codes.

Estos catalogos no deben duplicarse innecesariamente si ya existen en Core Foundation.

Regla:

Patient puede referenciar catalogos; no debe convertirse en el propietario universal de todos los catalogos clinicos.

---

# 8. Eventos De Dominio

## Evento Oficial Del Agregado

`PatientRegistered` queda definido como evento oficial inicial del agregado `Patient`.

Debe emitirse cuando un paciente queda registrado en helix con identidad minima, perfil inicial y membresia organizacional inicial.

Payload conceptual minimo:

* `patientId`
* `organizationId`
* `patientOrganizationMembershipId`
* `registeredBy`
* `registeredAt`
* `hasLinkedUser`

Restriccion:

No debe incluir payload clinico completo, datos de seguro completos ni documentos.

Eventos propuestos:

* `PatientRegistered`
* `PatientProfileUpdated`
* `PatientUserLinked`
* `PatientUserUnlinked`
* `PatientOrganizationMembershipCreated`
* `PatientOrganizationMembershipActivated`
* `PatientOrganizationMembershipRevoked`
* `PatientActivated`
* `PatientSuspended`
* `PatientArchived`
* `PatientMarkedDeceased`
* `PatientCareRelationshipAdded`
* `PatientCareRelationshipUpdated`
* `PatientCareRelationshipRevoked`
* `PatientEmergencyContactAdded`
* `PatientEmergencyContactUpdated`
* `PatientEmergencyContactRemoved`
* `PatientInsuranceCoverageAdded`
* `PatientInsuranceCoverageUpdated`
* `PatientInsuranceCoverageRemoved`
* `PatientConsentGranted`
* `PatientConsentDenied`
* `PatientConsentRevoked`
* `PatientConsentExpired`
* `PatientSettingsUpdated`

## Uso Esperado

Los eventos de dominio deben servir para:

* Auditoria funcional.
* Integraciones internas futuras.
* Observabilidad de adopcion.
* Proyecciones para dashboards.
* Sincronizacion futura con sistemas externos.

## Restriccion

Los eventos no deben contener payloads clinicos completos ni informacion sensible innecesaria.

## Vision Futura: Patient Timeline

Patient Timeline sera un concepto arquitectonico futuro, no incluido en la implementacion inicial de Patient Domain.

La Timeline debera concentrar los principales eventos de la vida del paciente dentro de helix:

* Registro del paciente.
* Cambios relevantes de estado.
* Relaciones de cuidado agregadas o revocadas.
* Consentimientos otorgados o revocados.
* Medicamentos iniciados, modificados o suspendidos.
* Tomas confirmadas, omitidas o retrasadas.
* Crisis o eventos clinicos importantes.
* Citas relevantes.
* Alertas y escalaciones.
* Cambios importantes en riesgo o HELIX Score.

Responsabilidad futura:

* Presentar una vista longitudinal comprensible del cuidado.
* Servir como base para dashboards de paciente y medico.
* Alimentar analitica poblacional con datos minimizados y gobernados.
* Preparar capacidades futuras de inteligencia artificial explicable.

Reglas de diseno:

* Patient Timeline no debe ser la fuente transaccional primaria de medicamentos, crisis, citas, recordatorios ni expediente clinico.
* Debe construirse como proyeccion o lectura derivada de eventos y dominios propietarios.
* Debe respetar consentimiento, autorizacion por relacion y auditoria.
* No debe implementarse hasta que existan los dominios fuente suficientes y una estrategia clara de privacidad/retencion.

---

# 9. Estados Del Paciente

Estados propuestos:

* `draft`
* `active`
* `inactive`
* `suspended`
* `archived`
* `deceased`
* `merged` futuro

## Definicion

### `draft`

Paciente creado de forma incompleta. Puede existir durante flujos administrativos o importaciones.

### `active`

Paciente activo para continuidad de cuidado.

### `inactive`

Paciente sin seguimiento activo, pero con historial conservado.

### `suspended`

Paciente bloqueado temporalmente por decision administrativa, legal, seguridad o revision.

### `archived`

Paciente archivado. No debe recibir nuevas acciones operativas salvo consulta historica autorizada.

### `deceased`

Paciente fallecido. Debe detener recordatorios ordinarios y requerir reglas especiales para acceso historico, familia, medico y cumplimiento legal.

### `merged`

Estado futuro para registros fusionados por un proceso formal de identidad. No debe implementarse hasta existir una estrategia de Master Patient Index.

## Transiciones Iniciales Permitidas

* `draft -> active`
* `draft -> archived`
* `active -> inactive`
* `active -> suspended`
* `active -> archived`
* `active -> deceased`
* `inactive -> active`
* `inactive -> archived`
* `suspended -> active`
* `suspended -> archived`
* `archived -> active` solo con privilegio administrativo y auditoria fuerte

Regla:

Todas las transiciones sensibles deben generar auditoria.

---

# 10. Reglas De Negocio

## 10.1 Creacion De Paciente

* El contexto inicial de organizacion es obligatorio.
* El paciente debe crearse con una `PatientOrganizationMembership` inicial hacia una organizacion activa.
* En MVP, esa membresia inicial debe ser la membresia activa principal del paciente.
* Nombre minimo requerido para operacion humana.
* Fecha de nacimiento debe ser opcional inicialmente, pero si se captura no puede estar en el futuro.
* `timezone` debe resolverse desde paciente, usuario u organizacion, con preferencia por paciente.
* `language` y `preferredLocale` deben validarse contra catalogos soportados.
* `userId` es opcional.

## 10.2 Usuario Vinculado

* Un paciente puede estar vinculado a un usuario interno cuando el paciente usa helix directamente.
* Un usuario paciente no debe poder quedar vinculado a multiples pacientes activos dentro de la misma organizacion sin una regla explicita.
* Un paciente puede existir sin usuario propio.
* Vincular `userId` debe emitir evento y auditoria.

## 10.3 Multi-Tenancy

* Todo paciente operativo debe tener al menos una membresia Patient-Organization vigente o historica.
* En MVP debe existir maximo una membresia activa principal.
* Toda consulta de paciente debe validar organizacion contra `PatientOrganizationMembership`.
* No debe existir consulta clinica por `patientId` sin contexto organizacional.
* El acceso cruzado entre organizaciones debe requerir consentimiento, relacion y una decision de arquitectura futura.

## 10.4 Relacion De Cuidado

* Un medico no puede ver cualquier paciente solo por tener rol `physician`.
* Un familiar no puede ver informacion solo por tener rol `caregiver` o `patient`.
* Un cuidador necesita relacion vigente con el paciente.
* Un asistente medico necesita relacion autorizada, normalmente derivada del medico u organizacion.
* La relacion debe tener status vigente.
* La relacion debe tener alcance de acceso.

## 10.5 Consentimiento

* El consentimiento debe ser explicito cuando aplique.
* El consentimiento debe tener alcance.
* El consentimiento puede expirar.
* El consentimiento puede revocarse.
* Revocar consentimiento debe afectar futuras decisiones de autorizacion.
* Revocar consentimiento no elimina historico ni auditoria.
* Consentimiento de emergencia debe ser tratado como caso especial, con auditoria fuerte y razon obligatoria.

## 10.6 Contactos De Emergencia

* Debe permitirse mas de un contacto.
* Debe existir prioridad.
* Un contacto puede recibir alertas solo si esta permitido.
* Un contacto no recibe acceso clinico automaticamente.
* Se debe poder registrar contacto no usuario.

## 10.7 Seguros

* Debe permitirse cero, una o multiples coberturas.
* Solo una cobertura primaria activa por paciente y organizacion.
* Datos de poliza deben protegerse como sensibles.
* No se debe modelar facturacion ni claims dentro de Patient.

## 10.8 Configuracion Personal

* El paciente debe tener zona horaria.
* El paciente debe tener idioma/preferred locale.
* Preferencias de comunicacion no garantizan envio; Notification decide canal final.
* Quiet hours informan a Reminder/Notification, pero no reemplazan sus reglas.

## 10.9 Soft Delete y Retencion

* Patient no debe eliminarse fisicamente salvo politica legal especifica y aprobada.
* Debe existir `deletedAt` o `archivedAt` segun el modelo final.
* Datos clinicos asociados no deben borrarse por eliminar el perfil operativo.
* Derecho de rectificacion debe separarse de destruccion de historial clinico.

## 10.10 Auditoria

Acciones sensibles:

* Crear paciente.
* Cambiar estado.
* Vincular usuario.
* Agregar o revocar relacion de cuidado.
* Agregar o revocar consentimiento.
* Consultar informacion sensible.
* Actualizar seguros.
* Actualizar contactos de emergencia.
* Archivar o marcar fallecido.

---

# 11. Relaciones Con Organizaciones

Patient se relaciona con organizaciones mediante `PatientOrganizationMembership`.

## Organizacion Como Tenant

La organizacion es el limite logico primario:

* Medico independiente.
* Clinica.
* Hospital.
* Aseguradora o programa futuro.
* Contexto individual/familiar si el producto lo requiere.

## Reglas

* Una organizacion puede tener muchos pacientes.
* Un paciente puede tener multiples membresias organizacionales a largo plazo.
* En MVP, un paciente tendra una sola membresia activa principal.
* Un usuario puede tener multiples memberships en organizaciones distintas.
* El acceso a pacientes dentro de una organizacion requiere membership activa del usuario, membresia vigente del paciente en esa organizacion, rol formal, permiso, relacion y consentimiento cuando aplique.

## Riesgo De Duplicidad

El mismo paciente real puede existir en dos organizaciones.

Decision propuesta:

* Usar `PatientOrganizationMembership` para evitar acoplar permanentemente Patient a una unica organizacion.
* Limitar a una membresia activa principal en MVP.
* No intentar deduplicacion global temprana.
* Preparar `externalReference` e identificadores de referencia.
* Diseñar futura capa de identity resolution.

---

# 12. Relaciones Con Medicos

Los medicos son usuarios con rol formal `physician` dentro de una organizacion.

La relacion medico-paciente debe ser explicita.

Tipos sugeridos:

* `primary_physician`
* `treating_physician`
* `covering_physician`
* `consulting_physician`

Reglas:

* Solo debe existir un `primary_physician` activo por paciente y organizacion, salvo que negocio apruebe multiples.
* Un medico tratante puede gestionar tratamientos si tiene permisos y relacion activa.
* Un medico consultor puede tener acceso limitado, segun consentimiento y scope.
* Cambiar medico primario debe generar auditoria y evento.
* Asistentes medicos no heredan automaticamente todos los pacientes del medico salvo que exista regla organizacional documentada.

---

# 13. Relaciones Con Familiares

Familiares pueden ser:

* Usuarios internos de helix.
* Contactos no usuarios.
* Representantes autorizados.
* Tutores o responsables legales futuros.

Tipos sugeridos:

* `parent`
* `spouse`
* `child`
* `sibling`
* `legal_guardian`
* `trusted_family_member`
* `other_family`

Reglas:

* Familiar no equivale a cuidador.
* Familiar no equivale a contacto de emergencia.
* Familiar no equivale a representante legal.
* El acceso de familiares debe depender de consentimiento y scope.
* Para pacientes menores o dependientes, se debe preparar futuro modelo de representante legal.

---

# 14. Relaciones Con Cuidadores

Cuidadores pueden apoyar seguimiento diario sin ser familiares ni profesionales clinicos.

Tipos sugeridos:

* `informal_caregiver`
* `professional_caregiver`
* `home_care_staff`
* `facility_caregiver`

Reglas:

* Cuidador puede registrar confirmaciones o eventos solo si el scope lo permite.
* Cuidador no debe modificar diagnosticos ni decisiones medicas.
* Cuidador puede recibir alertas si hay consentimiento.
* Cuidador puede tener acceso temporal.
* Revocar cuidador debe cortar acceso futuro.

---

# 15. Contactos De Emergencia

El contacto de emergencia es una entidad de soporte operativo, no necesariamente una relacion de autorizacion clinica.

Datos recomendados:

* Nombre.
* Relacion descriptiva.
* Telefono.
* Email opcional.
* Idioma preferido.
* Prioridad.
* Disponibilidad u horario opcional futuro.
* Permiso para recibir alertas.
* Notas breves.

Reglas:

* Debe permitirse ordenar contactos por prioridad.
* Debe evitarse almacenar notas clinicas extensas en contacto.
* Debe distinguirse `canReceiveAlerts` de `canAccessClinicalData`.
* Cambios en contactos deben auditarse.

---

# 16. Informacion De Seguros

Patient puede guardar cobertura basica necesaria para continuidad de cuidado.

Datos recomendados:

* Aseguradora.
* Nombre de plan.
* Numero de poliza.
* Numero de grupo.
* Tipo de cobertura.
* Pais.
* Vigencia.
* Cobertura primaria.
* Estado.

Fuera de Patient:

* Claims.
* Facturacion.
* Elegibilidad en tiempo real.
* Autorizaciones previas.
* Pagos.
* Contratos con aseguradoras.

Riesgo:

Datos de seguros pueden ser sensibles y deben tratarse con controles similares a datos clinicos.

---

# 17. Consentimientos

Consentimiento es central para helix porque la autorizacion aprobada combina RBAC con relaciones.

## Modelo Conceptual

Un consentimiento responde:

* Quien otorga.
* Para quien aplica.
* A quien se concede.
* Que alcance tiene.
* Desde cuando aplica.
* Hasta cuando aplica.
* Como fue capturado.
* Si fue revocado.

## Scopes Iniciales

Scopes recomendados:

* `profile.read`
* `profile.write`
* `contacts.read`
* `contacts.write`
* `insurance.read`
* `medications.read`
* `medications.write`
* `clinical_summary.read`
* `crisis_events.read`
* `appointments.read`
* `notifications.receive`
* `emergency_access`

## Relacion Con Authorization Foundation

Authorization debe evaluar:

1. Usuario autenticado.
2. Organizacion.
3. Membership activa.
4. Rol formal.
5. Permiso.
6. Relacion con paciente.
7. Consentimiento vigente cuando aplique.

Patient debe proveer la relacion y consentimiento; Authorization decide `ALLOW` o `DENY`.

## Recomendacion

En MVP, consentimientos pueden vivir dentro del dominio Patient.

En fases avanzadas, si los consentimientos crecen en complejidad legal, jurisdiccional o documental, conviene extraer un `Consent Management Domain`.

---

# 18. Configuracion Personal Del Paciente

Configuracion que pertenece a Patient:

* Idioma.
* Locale preferido.
* Zona horaria.
* Preferencia de unidades.
* Preferencias basicas de comunicacion.
* Quiet hours.
* Preferencias de accesibilidad.
* Nivel de privacidad visible para familiares/cuidadores.

Configuracion que no pertenece a Patient:

* Plantillas de notificacion.
* Estado de entrega de mensajes.
* Cola de recordatorios.
* Reglas de escalamiento.
* Configuracion global del tenant.
* Feature flags.

Regla:

Patient define preferencia; Notification y Reminder ejecutan.

---

# 19. Que Informacion Pertenece Al Dominio Patient

Debe pertenecer a Patient:

* Identidad operativa del paciente en helix.
* Separacion conceptual entre Patient Identity y Patient Profile.
* Vinculo opcional con usuario interno.
* Datos personales basicos.
* Estado del paciente.
* Membresia Patient-Organization.
* Relaciones de cuidado.
* Contactos de emergencia.
* Informacion basica de seguros.
* Consentimientos de acceso y comunicacion.
* Configuracion personal del paciente.
* Identificadores externos/nacionales opcionales.
* Preferencias que afectan la experiencia y continuidad del cuidado.

Debe permanecer referenciado por `patientId`, pero no contenido en Patient:

* Tratamientos.
* Medicamentos.
* Tomas.
* Diagnosticos.
* Alergias.
* Cirugias.
* Vacunas.
* Notas clinicas.
* Crisis.
* Sintomas.
* Citas.
* Recordatorios.
* Notificaciones.
* Adjuntos clinicos.
* HELIX Score.
* Semaforo de riesgo.
* Patient Timeline operativa.

---

# 20. Dominios Separados Recomendados

## 20.1 Medications

Debe vivir separado.

Responsabilidad:

* Catalogo de medicamentos.
* Medicamentos prescritos al paciente.
* Dosis.
* Frecuencia.
* Horarios.
* Suspensiones.
* Historial de tomas.
* Adherencia.

Relacion:

* Usa `patientId`.
* Usa `prescribingPhysicianId`.
* Consulta Patient para timezone y estado.
* Consulta Authorization para acceso.

## 20.2 Clinical Records

Debe vivir separado.

Responsabilidad:

* Diagnosticos.
* Alergias.
* Antecedentes.
* Cirugias.
* Vacunas.
* Notas clinicas.
* Documentos.
* Versionado clinico.

Relacion:

* Usa `patientId`.
* Debe tener versionado fuerte.
* Debe respetar consentimiento y relacion.

## 20.3 Appointments

Debe vivir separado.

Responsabilidad:

* Consultas.
* Laboratorios.
* Renovaciones.
* Vacunas.
* Agenda.

Relacion:

* Usa `patientId`.
* Usa `organizationId`.
* Puede vincular medico y ubicacion.

## 20.4 Crises

Debe vivir separado, posiblemente dentro de Clinical Events.

Responsabilidad:

* Registro de crisis.
* Fecha/hora.
* Duracion.
* Severidad.
* Desencadenantes.
* Adjuntos.
* Geolocalizacion opcional.

Relacion:

* Usa `patientId`.
* Puede alimentar reglas, HELIX Score y dashboard medico.

## 20.5 Reminders

Debe vivir separado.

Responsabilidad:

* Programacion.
* Cola.
* Reintentos.
* Confirmaciones.
* Posponer.
* Omitir.
* Escalamientos.

Relacion:

* Usa preferencias de Patient.
* Usa medicamentos/citas como origen.
* Genera eventos funcionales.

## 20.6 Notifications

Debe vivir separado.

Responsabilidad:

* Push.
* Email.
* WhatsApp futuro.
* Estado de entrega.
* Plantillas.
* Reintentos.

Relacion:

* Usa preferencias y consentimiento del paciente.
* No es fuente oficial de informacion clinica.
* Firestore podria aportar valor en estados dinamicos, pero no en datos clinicos oficiales.

## 20.7 Risk Evaluation / HELIX Score

Debe vivir separado.

Responsabilidad:

* HELIX Score.
* Semaforo.
* Evaluaciones periodicas.
* Explicabilidad.

Relacion:

* Consume eventos de medications, crises, appointments y reminders.
* No debe sustituir criterio medico.
* Debe ser auditable y explicable.

## 20.8 Attachments

Debe vivir separado.

Responsabilidad:

* Metadatos de archivos.
* Tipo de archivo.
* Relacion con recurso clinico.
* Referencia a Cloud Storage.

Relacion:

* Usa `patientId`.
* No debe guardar binarios en PostgreSQL.

## 20.9 Patient Timeline

No debe implementarse todavia.

Responsabilidad futura:

* Concentrar eventos principales de la vida del paciente.
* Presentar una vista longitudinal para pacientes, medicos y cuidadores autorizados.
* Servir como base de analitica e inteligencia artificial explicable.

Relacion:

* Usara `patientId`.
* Consumira eventos de Patient, Medications, Clinical Records, Appointments, Crises, Reminders, Notifications y Risk Evaluation.
* No sera fuente transaccional primaria.

---

# 21. Modelo De Autorizacion Esperado

Patient debe integrarse con Authorization Foundation sin mezclar responsabilidades.

## Patient Provee

* Existencia del paciente.
* Membresia vigente del paciente en la organizacion de contexto.
* Estado del paciente.
* Relacion entre usuario y paciente.
* Consentimiento vigente.
* Alcance permitido.

## Authorization Decide

* `ALLOW`
* `DENY`

## Audit Registra

* Intento exitoso.
* Intento fallido.
* Intento denegado.
* Cambios sensibles.

## Regla

Patient no debe decidir permisos globales. Patient debe exponer hechos de dominio que Authorization pueda evaluar.

---

# 22. Integracion Con Sprint 1 Foundation

El dominio Patient debe construir sobre lo ya aprobado:

* `users` para identidad interna.
* `organizations` para tenant.
* `organization_memberships` para pertenencia.
* `roles` y `permissions` para RBAC.
* `AuthorizationService` para decision.
* `AuditService` para trazabilidad.
* `Core` para idiomas, zonas horarias, parametros y feature flags.

Permisos ya preparados:

* `patients.read`
* `patients.write`
* `medications.read`
* `medications.write`
* `appointments.read`
* `appointments.write`
* `clinical_events.read`
* `clinical_events.write`

El siguiente modulo de implementacion deberia crear primero el modelo Patient y su membresia organizacional inicial para que Authorization pueda dejar de usar un contexto paciente abstracto.

---

# 23. Riesgos De Diseno

## 23.1 Patient Como Mega-Agregado

Riesgo:

Meter medicamentos, expediente, crisis, recordatorios y notificaciones dentro de Patient haria el agregado inmanejable.

Mitigacion:

Patient debe conservar solo identidad, relaciones, consentimientos, contactos, seguros y preferencias.

## 23.2 Duplicidad Entre Organizaciones

Riesgo:

Un mismo paciente real puede existir en varias organizaciones.

Mitigacion:

Usar `PatientOrganizationMembership`, limitar a una membresia activa principal en MVP y preparar identity resolution futuro.

## 23.3 Consentimiento Insuficiente

Riesgo:

Permitir acceso por rol y relacion sin consentimiento puede violar expectativas del paciente y regulaciones.

Mitigacion:

Modelar consentimiento desde Patient Platform y conectarlo a Authorization.

## 23.4 Contacto De Emergencia Confundido Con Acceso Clinico

Riesgo:

Un contacto podria ser tratado como usuario autorizado.

Mitigacion:

Separar contacto de emergencia, relacion de cuidado y consentimiento.

## 23.5 Datos Nacionales Obligatorios

Riesgo:

CURP, NSS u otros identificadores pueden hacer el producto menos internacional y excluir pacientes.

Mitigacion:

Hacer identificadores nacionales opcionales y modelarlos como referencias.

## 23.6 Datos Clinicos En Logs O Eventos

Riesgo:

Eventos de dominio o auditoria podrian contener informacion clinica innecesaria.

Mitigacion:

Eventos livianos, con IDs y metadata minima.

## 23.7 Timezone Incorrecto

Riesgo:

Recordatorios o medicamentos pueden ejecutarse en timezone equivocado.

Mitigacion:

Timezone explicito en Patient y reglas claras de fallback.

## 23.8 Menores Y Representantes Legales

Riesgo:

El MVP puede no cubrir adecuadamente menores, tutores o pacientes dependientes.

Mitigacion:

Preparar tipos de relacion y consentimiento sin implementar complejidad legal total en PI-2 inicial.

## 23.9 Autorizacion Incompleta

Riesgo:

Crear endpoints Patient sin resolver relacion/consentimiento podria abrir acceso indebido.

Mitigacion:

No exponer endpoints clinicos hasta que el modulo Patient alimente Authorization con relacion real.

## 23.10 Mezcla De Patient Con User

Riesgo:

Asumir que todo paciente tiene usuario rompe casos de clinica, adulto mayor, cuidador o paciente creado por medico.

Mitigacion:

`userId` opcional en Patient.

## 23.11 Acoplamiento Entre Identidad Y Perfil

Riesgo:

Tratar identidad y perfil como el mismo concepto dificultaria deduplicacion, verificacion futura e integraciones internacionales.

Mitigacion:

Separar conceptualmente `PatientIdentity` y `PatientProfile` desde el dominio, aunque la persistencia inicial sea simple.

## 23.12 Timeline Como Fuente Transaccional

Riesgo:

Implementar Patient Timeline como tabla principal de eventos clinicos podria duplicar verdades transaccionales y generar inconsistencias.

Mitigacion:

Documentar Timeline como proyeccion futura derivada de eventos y dominios propietarios.

---

# 24. Recomendaciones

## 24.1 Implementacion Por Modulos

No implementar todo Patient Platform en una sola entrega.

Orden recomendado:

1. Patient Core Foundation: entidad Patient, Patient Identity, Patient Profile, membresia Patient-Organization inicial, perfil basico, estado, repositorio, migracion, tests, documentacion.
2. Patient Relationships Foundation: relaciones medico, familiar, cuidador, self.
3. Patient Consent Foundation: consentimientos y scopes.
4. Patient Emergency Contacts Foundation.
5. Patient Insurance Foundation.
6. Patient Settings Foundation.
7. Patient Authorization Integration: conectar relacion real con Authorization.
8. Patient API Boundary: endpoints minimos protegidos, no clinicos profundos.
9. Patient Timeline Projection futuro, solo cuando existan suficientes dominios fuente y reglas de privacidad.

## 24.2 Mantener Patient Delgado

Patient debe ser estable y relativamente pequeno.

Los dominios clinicos deben depender de `patientId`, no vivir dentro del agregado.

## 24.3 Disenar Consentimiento Desde El Inicio

Aunque el MVP use consentimiento simple, el modelo debe permitir:

* Revocacion.
* Expiracion.
* Scopes.
* Evidencia.
* Auditoria.

## 24.4 Autorizacion Clinica Conservadora

Ante duda, Authorization debe responder `DENY`.

No debe existir acceso clinico por rol solamente.

## 24.5 Preparar Internacionalizacion

No hacer obligatorios identificadores locales.

Usar:

* Country.
* Locale.
* Timezone.
* Catalogos configurables.

## 24.6 Versionado Y Auditoria

Cambios sensibles de Patient deben quedar auditados.

Para datos clinicos profundos, usar versionado en dominios clinicos separados.

## 24.7 Mantener PostgreSQL Como Fuente Oficial

Patient y sus relaciones/consentimientos deben persistir en PostgreSQL.

Firestore no debe usarse para Patient en PI-2 salvo decision documentada posterior y una justificacion clara.

---

# 25. Criterios De Aprobacion Del Diseno

Antes de implementar Patient Platform, se recomienda aprobar:

* Patient usara `PatientOrganizationMembership` como relacion conceptual con organizaciones.
* En MVP existira una sola membresia activa principal por paciente.
* Patient Identity y Patient Profile quedaran separados conceptualmente, aunque puedan persistirse juntos inicialmente si se justifica.
* `userId` sera opcional en Patient.
* Patient no contendra medicamentos, expediente, crisis, citas, recordatorios ni notificaciones.
* Relaciones de cuidado seran parte del dominio Patient.
* Consentimientos iniciales seran parte del dominio Patient.
* `PatientRegistered` sera evento oficial del agregado.
* Patient Timeline sera una vision arquitectonica futura, no una fuente transaccional ni parte de la implementacion inicial.
* Contactos de emergencia no implicaran acceso clinico automatico.
* Insurance sera informacion basica, no claims/facturacion.
* Authorization leera relacion y consentimiento reales del dominio Patient.
* Toda accion sensible quedara auditada.
* Firestore no sera fuente oficial de Patient.

---

# 26. Siguiente Modulo Recomendado

Si este diseno es aprobado, el siguiente modulo recomendado es:

**Patient Core Foundation**

Alcance recomendado:

* Crear modelo de dominio `Patient`.
* Separar conceptualmente `PatientIdentity` y `PatientProfile`.
* Crear value objects minimos.
* Crear tabla `patients`.
* Preparar tabla o modelo `patient_organization_memberships`.
* Vincular la membresia inicial con `organizations.id`.
* Vincular `patients.user_id` opcionalmente con `users.id`.
* Emitir/modelar evento `PatientRegistered`.
* Modelar status inicial.
* Modelar perfil basico.
* Crear repositorio PostgreSQL.
* Crear casos de uso minimos:
  * create patient
  * find patient by id
  * find patient by user id
  * update basic patient profile
  * change patient status
* Agregar validaciones.
* Agregar tests.
* Actualizar documentacion tecnica.

No incluir todavia:

* Medicamentos.
* Expediente clinico.
* Crisis.
* Recordatorios.
* Frontend.
* Firestore.
* Endpoints clinicos amplios.
* Patient Timeline.

---

# Decision Pendiente

Este documento queda pendiente de aprobacion antes de iniciar cualquier implementacion de PI-2 Patient Platform.
