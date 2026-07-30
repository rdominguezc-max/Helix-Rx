# Sprint 1 - Core Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Crear la base de configuracion global del sistema para soportar futuras configuraciones de plataforma y de organizaciones antes de implementar autenticacion.

---

# Alcance

Incluye:

* Configuracion global.
* Configuracion por organizacion.
* Catalogos base.
* Idiomas soportados.
* Zonas horarias soportadas.
* Feature flags preparados.
* Parametros del sistema.
* Casos de uso internos.
* Tests unitarios.

No incluye:

* Firebase Auth.
* JWT.
* Login.
* Endpoints publicos.
* Frontend.
* Funcionalidades clinicas.

---

# Modelo

Tablas creadas:

* `system_parameters`
* `organization_settings`
* `supported_languages`
* `supported_timezones`
* `feature_flags`
* `catalog_items`

Los valores flexibles se almacenan como `jsonb`.

---

# Semillas Iniciales

Idiomas:

* `es`
* `en`

Zonas horarias:

* `UTC`
* `America/Hermosillo`
* `America/Mexico_City`
* `America/Tijuana`
* `America/New_York`
* `America/Los_Angeles`

Parametros:

* `platform.default_language`
* `platform.default_locale`
* `platform.default_timezone`

Feature flags preparados:

* `auth.firebase.enabled`
* `frontend.pwa.enabled`
* `clinical.modules.enabled`

Catalogos iniciales:

* `audit_results`
* `user_statuses`

---

# Casos De Uso

Casos de uso creados:

* `GetSystemParameterUseCase`
* `SetSystemParameterUseCase`
* `GetOrganizationSettingUseCase`
* `SetOrganizationSettingUseCase`
* `ListSupportedLanguagesUseCase`
* `ListSupportedTimezonesUseCase`
* `IsFeatureEnabledUseCase`
* `ListCatalogItemsUseCase`

---

# Feature Flags

Los feature flags soportan:

* Configuracion global.
* Override por organizacion.

La precedencia es:

1. Flag especifico de organizacion.
2. Flag global.
3. `false` si no existe.

---

# Migracion

Migracion creada:

* `database/migrations/007_core_foundation.sql`

---

# Riesgos

* Las configuraciones flexibles con `jsonb` requieren disciplina para no convertirse en un contenedor sin contrato.
* Aun no existen endpoints ni pantallas administrativas para administrar estas configuraciones.
* La migracion no fue validada contra PostgreSQL real porque Docker no esta disponible en este entorno.

---

# Siguiente Paso Recomendado

Implementar Auth Foundation para integrar Firebase Authentication con usuarios internos, usando Core Foundation para preparar flags y configuracion sin acoplar Auth al resto del dominio.
