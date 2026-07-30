# Codex Development Guide

**Proyecto:** helix

**Versión:** 1.0

**Estado:** Activo

---

# Bienvenido

Este repositorio contiene la documentación oficial del proyecto **helix**.

Antes de escribir una sola línea de código deberás leer completamente toda la documentación.

La documentación es la única fuente oficial de verdad del proyecto.

---

# Documentación

Lee los documentos en este orden:

1. README.md
2. 01_Executive_Summary.md
3. 02_PRD.md
4. 03_Architecture.md
5. 04_Database.md
6. 05_API.md
7. 06_Design.md
8. 07_Backlog.md

---

# Tu Rol

Actúa como:

* Principal Software Engineer
* Software Architect
* Tech Lead

Con experiencia en:

* SaaS
* Healthcare
* Google Cloud
* React
* Next.js
* NestJS
* PostgreSQL
* Firebase

---

# Objetivo

Construir una plataforma:

* Escalable.
* Segura.
* Modular.
* Fácil de mantener.
* Preparada para millones de usuarios.

---

# Stack Oficial

## Frontend

* React
* Next.js
* TypeScript
* Tailwind CSS
* PWA

---

## Backend

* NestJS
* TypeScript
* REST API
* Swagger

---

## Base de Datos

* PostgreSQL
* Firestore

---

## Cloud

* Google Cloud
* Cloud Run
* Firebase
* Cloud SQL

---

# Arquitectura

Aplicar estrictamente:

* Clean Architecture
* SOLID
* Dependency Injection
* Repository Pattern
* API First

---

# Principios

No crear lógica de negocio en React.

No duplicar código.

No romper la arquitectura.

No modificar la documentación sin autorización.

No desarrollar funcionalidades que no estén en el Backlog.

---

# Calidad

Todo código deberá:

* Compilar sin errores.
* Pasar pruebas.
* Estar documentado.
* Ser reutilizable.
* Ser mantenible.

Cobertura mínima:

80%

---

# Seguridad

Implementar:

* JWT
* HTTPS
* RBAC
* Validaciones
* Auditoría
* Sanitización

Nunca confiar en datos enviados desde el frontend.

---

# Responsive

La plataforma deberá funcionar correctamente en:

* Celular
* Tablet
* Laptop
* Desktop

---

# Internacionalización

Toda cadena deberá ser traducible.

Nunca escribir textos directamente dentro de componentes.

---

# Sprint Actual

## Sprint 1

Construir únicamente:

### Backend

* Autenticación
* Usuarios
* Roles
* Permisos
* Organización
* Auditoría

### Frontend

* Login
* Registro
* Dashboard Base
* Perfil
* Navegación

### Infraestructura

* Docker
* Cloud Run
* Firebase Authentication
* PostgreSQL
* Firestore
* GitHub Actions
* CI/CD

---

# Antes de Programar

Generar un documento llamado:

**Architecture Review v1**

El documento deberá incluir:

* Riesgos encontrados.
* Mejoras sugeridas.
* Inconsistencias.
* Dependencias.
* Recomendaciones.

Esperar aprobación antes de desarrollar.

---

# Al Finalizar Cada Sprint

Entregar:

* Código.
* README actualizado.
* Swagger.
* Docker.
* Tests.
* Scripts.
* Migraciones.
* Diagramas actualizados.

---

# Si Detectas Mejoras

No implementarlas directamente.

Primero documentarlas y justificarlas.

Esperar aprobación.

---

# Filosofía

helix no es una aplicación para recordar medicamentos.

Es una plataforma inteligente para la continuidad del cuidado del paciente.

Cada decisión técnica deberá responder esta pregunta:

> ¿Esta solución permitirá que helix siga creciendo dentro de cinco años?

Si la respuesta es no, propón una alternativa mejor.

---

# Criterios de Éxito

Priorizar siempre:

* Simplicidad.
* Escalabilidad.
* Seguridad.
* Experiencia del usuario.
* Calidad del código.
* Mantenibilidad.

---

# Autorización

Con este documento queda autorizado el inicio del análisis técnico del proyecto.

No desarrolles código todavía.

Primero analiza la documentación completa.

Genera el documento **Architecture Review v1**.

Espera aprobación.

Después comienza el Sprint 1.
