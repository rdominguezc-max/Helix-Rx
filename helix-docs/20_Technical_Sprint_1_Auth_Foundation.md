# Sprint 1 - Auth Foundation

**Proyecto:** helix

**Estado:** Implementado, pendiente de aprobacion

---

# Objetivo

Integrar Firebase Authentication con usuarios internos de helix sin mezclar autenticacion con autorizacion.

Auth identifica al usuario.  
Authorization decide permisos.  

---

# Alcance

Incluye:

* Configuracion de Firebase Admin SDK.
* Modulo `auth`.
* Verificacion de Firebase ID Token.
* Vinculo `firebase_uid` con `users.id`.
* Caso de uso `AuthenticateFirebaseUserUseCase`.
* Servicio interno `AuthService`.
* Actualizacion de `last_login_at` y `last_activity_at`.
* Contexto de usuario autenticado.
* Auditoria de login exitoso/fallido.
* Respeto del feature flag `auth.firebase.enabled`.
* Tests unitarios.

No incluye:

* Frontend.
* Login visual.
* JWT propio.
* Guards HTTP.
* Pacientes.
* Medicamentos.
* Funcionalidades clinicas.
* Endpoints clinicos.

---

# Variables De Entorno

Variables preparadas:

* `FIREBASE_PROJECT_ID`
* `FIREBASE_CLIENT_EMAIL`
* `FIREBASE_PRIVATE_KEY`

Estas variables solo son requeridas cuando `auth.firebase.enabled` esta activo y se intenta verificar un token real.

---

# Flujo De Autenticacion

1. Validar forma basica del ID token.
2. Verificar que `auth.firebase.enabled` este activo.
3. Verificar Firebase ID Token con Firebase Admin SDK.
4. Buscar usuario interno por `firebase_uid`.
5. Si no existe, buscar por email y vincular `firebase_uid`.
6. Si tampoco existe, crear usuario interno minimo desde identidad Firebase.
7. Actualizar `last_login_at` y `last_activity_at`.
8. Registrar evento de auditoria.
9. Devolver `AuthenticatedUserContext`.

---

# Aislamiento De Firebase

Firebase queda encapsulado detras del puerto:

* `FirebaseTokenVerifier`

Implementacion:

* `FirebaseAdminTokenVerifier`

El caso de uso no depende directamente del SDK.

---

# Contexto Autenticado

`AuthenticatedUserContext` contiene:

* `userId`
* `firebaseUid`
* `email`
* `emailVerified`

No contiene permisos ni decisiones de autorizacion.

---

# Auditoria

Eventos:

* `auth.firebase.login` con `success`.
* `auth.firebase.login` con `failure`.

Auth registra eventos, pero no implementa auditoria automatica de guards.

---

# Riesgos

* Firebase Admin no fue probado contra credenciales reales en este entorno.
* La creacion automatica de usuario interno desde Firebase debera revisarse contra el flujo final de registro.
* No existe todavia endpoint HTTP ni guard para consumir este modulo.
* La politica de email verificado podria endurecerse antes de produccion.

---

# Siguiente Paso Recomendado

Implementar Auth HTTP Boundary o Guards Foundation para conectar token bearer con `AuthService` y `AuthorizationService`, manteniendo separadas autenticacion, autorizacion y auditoria.
