# API Specification

**Proyecto:** helix

**Versión:** 0.1

**Estado:** Draft

---

# Objetivo

Definir el estándar de desarrollo de las APIs de helix.

Toda funcionalidad del sistema deberá estar disponible mediante APIs documentadas.

La API será el núcleo de la plataforma.

---

# Principios

* API First.
* REST.
* JSON.
* HTTPS obligatorio.
* Versionado.
* Seguridad.
* Consistencia.
* Documentación completa.

---

# Versionado

Todas las APIs utilizarán el siguiente formato:

```
/api/v1/
```

Ejemplos:

```
/api/v1/auth/login
```

```
/api/v1/patients
```

```
/api/v1/medications
```

---

# Autenticación

Se utilizará:

* JWT
* Refresh Token
* OAuth 2.0 (futuro)
* MFA (futuro)

---

# Endpoints

## Authentication

* Login
* Logout
* Refresh Token
* Forgot Password
* Change Password

---

## Users

* Crear usuario
* Consultar usuario
* Actualizar usuario
* Desactivar usuario

---

## Patients

* Alta
* Consulta
* Actualización
* Expediente

---

## Medical Record

* Diagnósticos
* Alergias
* Cirugías
* Vacunas
* Estudios
* Notas

---

## Medications

* Catálogo
* Asignación
* Suspensión
* Historial

---

## Medication Intake

* Confirmar toma
* Omitir
* Posponer
* Historial

---

## Symptoms

* Registrar
* Consultar
* Actualizar

---

## Crisis

* Registrar crisis
* Consultar historial
* Adjuntar archivos

---

## Appointments

* Crear
* Modificar
* Cancelar
* Confirmar

---

## Contacts

* Alta
* Edición
* Eliminación lógica

---

## Notifications

* Push
* Correo
* WhatsApp (futuro)

---

## Dashboard

* Dashboard Paciente
* Dashboard Médico
* Dashboard Administrador

---

## Reports

* Adherencia
* HELIX Score
* Crisis
* Medicamentos

---

## Rules Engine

* Consultar reglas
* Crear reglas
* Activar
* Desactivar

---

# Formato de Respuesta

Respuesta correcta

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

---

Respuesta con error

```json
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient not found"
  }
}
```

---

# Paginación

Todas las listas deberán soportar:

* page
* pageSize
* search
* filter
* orderBy

---

# Auditoría

Todas las operaciones importantes deberán registrar:

* Usuario
* Fecha
* Dirección IP
* Acción realizada
* Resultado

---

# Seguridad

Todas las APIs deberán:

* Validar permisos.
* Validar roles.
* Validar datos recibidos.
* Registrar auditoría.
* Utilizar HTTPS.

---

# Integraciones Futuras

Preparar la API para integrar:

* Apple Health
* Google Health Connect
* HL7
* FHIR
* Laboratorios
* Hospitales
* Wearables
* IA

---

# Documentación

Toda API deberá documentarse automáticamente mediante:

* Swagger
* OpenAPI

---

# Definición Final

La API será el contrato oficial entre el frontend, el backend y las futuras integraciones.

Ningún módulo deberá acceder directamente a la base de datos sin pasar por las reglas de negocio implementadas en el backend.
