# PI-2 - Runtime Validation And Patient Access Bootstrap

**Proyecto:** helix

**Estado:** Implementado y validado en runtime local

**Fecha:** 30 de julio de 2026

---

# Resultado

Se agrego `scripts/bootstrap-patient-access.ts` como ruta interna y controlada
para resolver el bootstrap de la primera relacion y consentimiento de acceso a
un paciente.

La herramienta:

* valida UUIDs y configuracion antes de conectarse;
* exige que organizacion, usuario y paciente existan;
* exige memberships activas del usuario y del paciente en la organizacion;
* crea o actualiza de forma idempotente la relacion de cuidado;
* reutiliza un consentimiento activo vigente o crea uno nuevo;
* ejecuta todo dentro de una transaccion;
* opera en modo preview por defecto y revierte los cambios;
* solo confirma cambios cuando recibe `--apply`.

# Configuracion

Variables:

```text
BOOTSTRAP_ORGANIZATION_ID=<uuid>
BOOTSTRAP_PATIENT_ID=<uuid>
BOOTSTRAP_USER_ID=<uuid>
BOOTSTRAP_RELATIONSHIP_TYPE=organization_admin_viewer
BOOTSTRAP_CONSENT_TYPE=patient_data_access
BOOTSTRAP_CONSENT_SCOPES=patients.read,patients.write
```

# Ejecucion

Preview seguro:

```bash
pnpm exec tsx scripts/bootstrap-patient-access.ts
```

Aplicacion explicita:

```bash
pnpm exec tsx scripts/bootstrap-patient-access.ts --apply
```

# Validaciones Locales

Resultados del 30 de julio de 2026:

* lint: aprobado;
* typecheck: aprobado;
* build: aprobado;
* tests: 27 archivos y 82 pruebas aprobadas.

# Validacion PostgreSQL

Resultados del 30 de julio de 2026:

* Docker Desktop 4.84.0 instalado sobre WSL 2;
* PostgreSQL 17 Alpine levantado mediante Compose y reportando `healthy`;
* migraciones `001` a `008` aplicadas correctamente;
* preview ejecutado sin persistir filas;
* bootstrap aplicado dos veces con los mismos IDs resultantes;
* permanecieron exactamente `1` relacion y `1` consentimiento;
* fixture temporal eliminado completamente.

PI-2 queda cerrado a nivel estatico, automatizado y de runtime PostgreSQL local.
