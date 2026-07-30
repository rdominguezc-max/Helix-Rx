# Sprint 1 - Infrastructure / CI Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Cerrar Sprint 1 con una base ejecutable, verificable y preparada para despliegue futuro.

---

# Alcance

Incluye:

* Dockerfile revisado.
* Docker Compose revisado.
* PostgreSQL local en Docker Compose.
* Scripts de validacion.
* GitHub Actions para CI.
* Baseline preparado para Cloud Run.
* README tecnico actualizado.

No incluye:

* Frontend.
* Pacientes.
* Medicamentos.
* Recordatorios.
* Expediente clinico.
* Funcionalidades clinicas.
* Despliegue real en Google Cloud.

---

# Docker

El `Dockerfile` define targets:

* `development`: usado por Docker Compose.
* `build`: compila TypeScript.
* `runtime`: imagen de ejecucion preparada para Cloud Run.

---

# Docker Compose

`docker-compose.yml` levanta:

* `postgres`
* `api`

La API ejecuta migraciones antes de iniciar:

```bash
pnpm migrate && pnpm start:dev
```

---

# GitHub Actions

Workflow creado:

* `.github/workflows/ci.yml`

Pasos:

* install
* lint
* typecheck
* build
* test

---

# Cloud Run

Baseline creado:

* `infrastructure/cloud-run/service.yaml`
* `infrastructure/cloud-run/README.md`

No se realiza despliegue real en esta entrega.

---

# Limitaciones Actuales

* Docker no esta disponible en el PowerShell actual, por lo que Compose no fue validado localmente.
* Cloud Run contiene placeholders.
* Las migraciones no estan integradas aun como job separado para Cloud Run.
* No existen endpoints clinicos ni frontend.

---

# Siguiente Paso Recomendado

Cerrar Sprint 1 con revision final de arquitectura, documentacion y checklist de aprobacion antes de iniciar la fase de frontend o modulos de negocio.
