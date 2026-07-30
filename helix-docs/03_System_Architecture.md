# System Architecture

**Proyecto:** helix

**Versión:** 0.1

**Estado:** Draft

---

# Objetivo

Definir la arquitectura tecnológica oficial de helix para garantizar una plataforma segura, escalable, modular y preparada para evolucionar durante los próximos años.

---

# Principios de Arquitectura

Toda decisión técnica deberá respetar los siguientes principios:

* API First
* Cloud Native
* Mobile First
* Clean Architecture
* SOLID
* Componentes reutilizables
* Seguridad por diseño
* Privacidad por diseño
* Escalabilidad horizontal

---

# Arquitectura General

```
Usuarios

Paciente
Médico
Familiar
Asistente Médico
Administrador

        │

        ▼

Frontend (PWA)

        │

REST API

        │

Backend

├── Auth Service
├── User Service
├── Patient Service
├── Medication Service
├── Reminder Service
├── Clinical Record Service
├── Dashboard Service
├── Notification Service
├── Rules Engine
├── Reporting Service
└── AI Gateway (Futuro)

        │

──────────────────────────────

Cloud SQL

Firestore

Cloud Storage

──────────────────────────────

Google Cloud

Firebase Authentication

Cloud Run

Cloud Scheduler

Firebase Messaging

Cloud Logging

Cloud Monitoring

Secret Manager

BigQuery
```

---

# Frontend

Tecnologías

* React
* Next.js
* TypeScript
* Tailwind CSS
* Progressive Web App (PWA)

---

# Backend

Tecnologías

* NestJS
* TypeScript
* REST API
* Swagger / OpenAPI

---

# Base de Datos

## Cloud SQL

Información transaccional

* Usuarios
* Pacientes
* Expedientes
* Medicamentos
* Consultas
* Agenda

---

## Firestore

Información dinámica

* Eventos
* Notificaciones
* Configuración
* Logs
* Cola de recordatorios

---

## Cloud Storage

Archivos

* Fotografías
* Videos
* PDF
* Recetas
* Estudios
* Laboratorios

---

# Servicios

## Auth Service

Autenticación.

Roles.

Permisos.

Sesiones.

---

## Patient Service

Pacientes.

Expedientes.

Contactos.

---

## Medication Service

Medicamentos.

Tratamientos.

Historial.

---

## Reminder Service

Recordatorios.

Confirmaciones.

Escalamientos.

---

## Clinical Record Service

Síntomas.

Crisis.

Adjuntos.

Historial.

---

## Dashboard Service

Dashboard Paciente.

Dashboard Médico.

Dashboard Administrador.

---

## Rules Engine

Motor de reglas configurable.

No requerirá modificar código para agregar nuevas reglas.

---

## Reporting Service

Reportes.

Indicadores.

Exportaciones.

---

## Notification Service

Push.

Correo.

WhatsApp (futuro).

SMS (futuro).

---

## AI Gateway

Preparado para integrar modelos de IA sin modificar el núcleo del sistema.

---

# Seguridad

* HTTPS obligatorio.
* JWT.
* OAuth.
* RBAC.
* Auditoría completa.
* Secret Manager.
* Cifrado en tránsito.
* Cifrado en reposo.

---

# Escalabilidad

Cada servicio podrá crecer de manera independiente.

Ejemplo:

Si aumentan los recordatorios únicamente crecerá Reminder Service.

---

# Observabilidad

Se implementarán:

* Cloud Logging.
* Cloud Monitoring.
* Alertas automáticas.
* Error Reporting.
* Dashboard Operativo.

---

# Integraciones Futuras

* FHIR.
* HL7.
* Apple Health.
* Google Health Connect.
* Wearables.
* Hospitales.
* Laboratorios.
* ERP Hospitalarios.

---

# Ambientes

Development

Testing

Staging

Production

Demo

Todos completamente independientes.

---

# DevOps

* GitHub
* GitHub Actions
* Docker
* Cloud Run
* CI/CD
* Versionado Semántico

---

# Definición Final

La arquitectura de helix deberá permitir incorporar nuevos módulos, enfermedades, organizaciones e integraciones sin modificar el núcleo de la plataforma.

Todo nuevo desarrollo deberá respetar esta arquitectura como estándar oficial del proyecto.
