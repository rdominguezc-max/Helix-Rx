# helix

Plataforma SaaS healthcare para continuidad del cuidado del paciente.

## Requisitos Locales

* Docker Desktop.
* Node.js 22 LTS o compatible.
* pnpm 11.

## Estado Actual

Sprint 1 completado. PI-2 Patient Platform validado en runtime local.

Incluye:

* NestJS monolito modular.
* PostgreSQL como fuente transaccional.
* Migraciones SQL.
* Health check.
* Organizations, memberships, users, permissions, roles.
* Authorization Foundation.
* Audit Log Foundation.
* Core Foundation.
* Auth Foundation con Firebase Admin aislado.
* Guards HTTP preparados.
* Endpoint no clinico `GET /api/v1/me`.
* Patient Foundation, perfil, relaciones de cuidado, contactos y consentimientos.
* Bootstrap interno de acceso inicial a pacientes.
* Medication Foundation: catalogo, presentaciones y tratamientos.
* PI-3 conversion de dosis e inventario transaccional del paciente.
* Ciclo de tratamientos, consumo automatico FEFO, riesgo de desabasto y adherencia registrada.
* Dosis esperadas por zona horaria y adherencia contra el plan completo.
* CI preparado con GitHub Actions.
* Cloud Run preparado mediante baseline documental/manifiesto.

No incluye:

* Frontend.
* Pacientes.
* Medicamentos.
* Recordatorios.
* Expediente clinico.
* Funcionalidades clinicas.
* Despliegue real en Google Cloud.

Firestore no esta habilitado en Sprint 1 salvo justificacion y aprobacion previa.

## Variables De Entorno

Usa [.env.example](D:/helix/.env.example) como referencia.

Variables principales:

* `NODE_ENV`
* `PORT`
* `APP_NAME`
* `DATABASE_HOST`
* `DATABASE_PORT`
* `DATABASE_USER`
* `DATABASE_PASSWORD`
* `DATABASE_NAME`
* `DATABASE_SSL`
* `FIREBASE_PROJECT_ID`
* `FIREBASE_CLIENT_EMAIL`
* `FIREBASE_PRIVATE_KEY`

Las variables Firebase solo son necesarias cuando `auth.firebase.enabled` esta activo y se verifican tokens reales.

## Scripts

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm migrate
pnpm start:dev
pnpm run ci
```

## Ejecutar Con Docker Compose

```bash
docker compose up --build
```

Servicios:

* `postgres`: PostgreSQL local.
* `api`: API NestJS en `http://localhost:3000`.

La API ejecuta migraciones antes de iniciar:

```bash
pnpm migrate && pnpm start:dev
```

Health check:

```bash
curl http://localhost:3000/api/v1/health
```

Endpoint autenticado preparado:

```bash
curl http://localhost:3000/api/v1/me \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "x-organization-id: <organization-id>"
```

## Ejecutar Sin Docker

Levanta PostgreSQL local y configura `.env`.

```bash
pnpm install
pnpm migrate
pnpm start:dev
```

## Validaciones Locales

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

O:

```bash
pnpm run ci
```

## CI

Workflow:

* [.github/workflows/ci.yml](D:/helix/.github/workflows/ci.yml)

Ejecuta:

* install
* lint
* typecheck
* build
* test

## Cloud Run

Baseline preparado:

* [service.yaml](D:/helix/infrastructure/cloud-run/service.yaml)
* [README.md](D:/helix/infrastructure/cloud-run/README.md)

No se realiza despliegue real en Sprint 1.

## Limitaciones Actuales

* Docker Desktop y PostgreSQL 17 fueron validados en runtime local.
* Las migraciones `001` a `012` fueron ejecutadas correctamente contra PostgreSQL real.
* Cloud Run contiene placeholders.
* No existe frontend.
* No existen modulos clinicos posteriores a Patient.
* `/me` requiere Firebase real y feature flag activo para uso end-to-end.

## Documentacion Oficial

La documentacion oficial vive en [helix-docs](D:/helix/helix-docs).


