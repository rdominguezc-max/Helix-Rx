# Product Requirements Document (PRD)

**Proyecto:** helix

**Versión:** 0.1

**Estado:** Draft

---

# 1. Objetivo del Producto

helix es una plataforma digital diseñada para mejorar la continuidad del cuidado del paciente, incrementando la adherencia al tratamiento mediante recordatorios inteligentes, seguimiento clínico, colaboración entre pacientes y médicos, y análisis de información.

---

# 2. Objetivos del MVP

El MVP deberá permitir:

* Registrar pacientes.
* Registrar médicos.
* Crear tratamientos.
* Programar medicamentos.
* Recordar cada toma.
* Confirmar u omitir medicamentos.
* Registrar síntomas.
* Registrar crisis.
* Llevar expediente clínico.
* Mostrar indicadores.
* Compartir información con el médico.

---

# 3. Alcance

## Incluye

* Gestión de usuarios.
* Roles.
* Autenticación.
* Expediente clínico.
* Medicamentos.
* Agenda.
* Recordatorios.
* Dashboard del paciente.
* Dashboard del médico.
* HELIX Score.
* Semáforo de riesgo.
* Modo Demo.
* Multiidioma.

## No incluye en esta versión

* Videoconsultas.
* Marketplace.
* Integración con wearables.
* IA generativa.
* Integraciones HL7/FHIR.
* Facturación.

---

# 4. Roles

## Paciente

Puede administrar su tratamiento y consultar su información.

## Familiar

Puede recibir alertas y consultar información autorizada.

## Médico

Puede administrar pacientes y tratamientos.

## Asistente Médico

Apoya al médico en el seguimiento de pacientes.

## Administrador

Administra toda la plataforma.

---

# 5. Módulos

## Usuarios

Registro.

Inicio de sesión.

Recuperación de contraseña.

Perfil.

Idiomas.

---

## Expediente Clínico

Datos personales.

Diagnósticos.

Alergias.

Cirugías.

Vacunas.

Antecedentes.

Notas.

Documentos.

---

## Medicamentos

Alta.

Edición.

Suspensión.

Dosis.

Frecuencia.

Horarios.

Fotografía.

Laboratorio.

Sustancia activa.

---

## Recordatorios

Push.

Correo.

WhatsApp (futuro).

Confirmación.

Posponer.

Omitir.

Historial.

---

## Registro Clínico

Síntomas.

Crisis.

Eventos.

Adjuntos.

GPS.

Fotografías.

Videos.

---

## Agenda

Consultas.

Laboratorios.

Recetas.

Renovaciones.

Vacunas.

---

## Contactos

Familiares.

Médicos.

Hospitales.

Aseguradoras.

Emergencias.

---

## Dashboard Paciente

Próximo medicamento.

HELIX Score.

Semáforo.

Próxima consulta.

Indicadores.

Acciones rápidas.

---

## Dashboard Médico

Pacientes.

Alertas.

Adherencia.

Consultas.

Indicadores.

Agenda.

---

# 6. HELIX Score

Indicador de 0 a 100 calculado considerando:

* Adherencia.
* Puntualidad.
* Consultas.
* Registro de eventos.
* Confirmaciones.
* Cumplimiento del tratamiento.

El HELIX Score nunca sustituirá el criterio médico.

---

# 7. Semáforo de Riesgo

Verde.

Amarillo.

Rojo.

Calculado mediante reglas configurables.

---

# 8. Motor de Reglas

Ejemplos:

* Dos medicamentos omitidos consecutivamente.
* Tres crisis en treinta días.
* Más de seis meses sin consulta.
* Adherencia menor al 80%.

Cada regla podrá generar acciones automáticas.

---

# 9. Requisitos No Funcionales

* API First.
* Cloud Native.
* Mobile First.
* Responsive.
* Multiidioma.
* Alta disponibilidad.
* Escalabilidad.
* Seguridad.
* Auditoría.
* Accesibilidad WCAG AA.

---

# 10. Indicadores de Éxito

* Usuarios activos.
* Adherencia promedio.
* Confirmaciones de medicamentos.
* Disminución de omisiones.
* Retención.
* Satisfacción del usuario.
* Tiempo de respuesta.
* Disponibilidad.

---

# 11. Roadmap

Fase 1

MVP.

Fase 2

Panel Médico Avanzado.

Fase 3

Clínicas.

Fase 4

Hospitales.

Fase 5

Aseguradoras.

Fase 6

Inteligencia Artificial.

Fase 7

Expansión Internacional.

---

# 12. Definición del Producto

helix no es una aplicación de recordatorios.

Es una plataforma inteligente de continuidad del cuidado del paciente diseñada para acompañar a las personas durante todo su tratamiento, facilitando la colaboración entre pacientes, familiares y profesionales de la salud.
