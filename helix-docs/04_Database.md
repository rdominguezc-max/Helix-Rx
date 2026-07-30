# Database Design

**Proyecto:** helix

**Versión:** 0.1

**Estado:** Draft

---

# Objetivo

Definir el modelo de datos oficial de helix para garantizar consistencia, escalabilidad y facilidad de integración futura con hospitales, laboratorios, aseguradoras y otros sistemas de salud.

---

# Principios

* UUID como llave primaria.
* Fechas almacenadas en UTC.
* Soft Delete.
* Auditoría completa.
* Historial de cambios.
* Versionado de información clínica.
* Integridad referencial.
* Escalabilidad.

---

# Entidades Principales

## Users

Representa cualquier usuario de la plataforma.

Campos principales:

* id
* first_name
* last_name
* email
* phone
* password_hash
* language
* country
* timezone
* status
* created_at
* updated_at

---

## Roles

Tipos de usuario:

* Patient
* Family
* Caregiver
* Physician
* Medical Assistant
* Administrator
* Demo

---

## Patients

Información clínica del paciente.

Campos:

* patient_id
* user_id
* CURP
* NSS
* Blood Type
* Height
* Weight
* BMI
* Insurance
* Primary Physician
* Emergency Contact

---

## Medical Records

Expediente clínico.

Contendrá:

* Diagnósticos
* Alergias
* Cirugías
* Vacunas
* Antecedentes
* Notas
* Estudios

Nunca se eliminará información.

---

## Medications

Catálogo general.

Campos:

* Commercial Name
* Generic Name
* Active Ingredient
* Laboratory
* Presentation
* Concentration
* Country

---

## Patient Medications

Medicamentos asignados al paciente.

Campos:

* Patient
* Medication
* Dose
* Frequency
* Schedule
* Start Date
* End Date
* Instructions
* Prescribing Physician

---

## Medication Intake

Registro de cada toma.

Campos:

* Scheduled Time
* Actual Time
* Status
* Delay
* Reason
* Notes

Estados posibles:

* Taken
* Skipped
* Delayed

---

## Symptoms

Registro de síntomas.

* Fecha
* Hora
* Intensidad
* Descripción
* Adjuntos

---

## Crisis Events

Registro de crisis.

* Fecha
* Hora
* Duración
* Tipo
* Gravedad
* Alcohol
* Estrés
* Sueño
* GPS
* Fotos
* Videos
* Notas

---

## Appointments

Consultas.

Laboratorios.

Vacunas.

Recetas.

Renovaciones.

---

## Contacts

Familiares.

Amigos.

Médicos.

Hospitales.

Aseguradoras.

Emergencias.

---

## Notifications

* Push
* Email
* WhatsApp
* Estado
* Historial

---

## Reminder Queue

Cola de recordatorios.

* Pendiente
* Enviado
* Confirmado
* Reintentando
* Error

---

## Risk Evaluation

Información calculada.

* HELIX Score
* Nivel de Riesgo
* Adherencia
* Fecha

---

## Rules Engine

Reglas configurables.

Campos:

* Nombre
* Condición
* Acción
* Prioridad
* Estado

---

## Audit Log

Toda acción importante deberá registrarse.

* Usuario
* Fecha
* Acción
* IP
* Dispositivo
* Resultado

---

## Attachments

Archivos relacionados con el paciente.

* Fotografías
* Videos
* PDF
* Estudios
* Laboratorios

---

# Relaciones Principales

Organization

↓

Patients

↓

Medical Record

↓

Patient Medications

↓

Medication Intake

↓

Symptoms

↓

Crisis Events

↓

Appointments

↓

Notifications

↓

Risk Evaluation

---

# Catálogos

* Medicamentos
* Laboratorios
* Idiomas
* Especialidades
* Diagnósticos
* Países
* Tipos de crisis
* Tipos de síntomas
* Roles
* Permisos

---

# Versionado Clínico

La información clínica nunca será sobrescrita.

Cada modificación generará una nueva versión para mantener el historial completo del paciente.

---

# Eliminación

No se eliminarán registros clínicos.

Se utilizarán los campos:

* deleted_at
* deleted_by
* delete_reason

---

# Índices Recomendados

* email
* patient_id
* physician_id
* medication_id
* organization_id
* scheduled_time
* created_at
* helix_score

---

# Analítica

BigQuery recibirá información anonimizada para generar indicadores, tendencias y modelos predictivos, respetando la privacidad y las regulaciones aplicables.

---

# Definición Final

El modelo de datos de helix deberá permitir agregar nuevas enfermedades, especialidades médicas y organizaciones sin modificar la estructura principal de la plataforma.
