# Medication Engine Vision

**Proyecto:** helix  
**Versión:** 0.1  
**Estado:** Draft  
**Fecha:** Junio 2026

---

# Objetivo

Diseñar la visión del futuro Medication Engine de helix.

El objetivo no es solamente recordar medicamentos.

El objetivo es administrar el tratamiento completo del paciente.

El Medication Engine será responsable de comprender:

- Prescripción médica.
- Presentación comercial.
- Conversión de dosis.
- Inventario.
- Adherencia.
- Duración estimada.
- Riesgo de desabasto.
- Renovación de receta.
- Indicadores clínicos.
- Integración con HELIX Score.
- Integración futura con HELIX AI.

---

# Principio Central

**helix no administra recordatorios.**

**helix administra tratamientos.**

---

# 1. Prescripción Médica

La prescripción representa exactamente lo indicado por el médico.

Ejemplo:

- Medicamento
- Sustancia activa
- Dosis
- Frecuencia
- Horarios
- Duración
- Indicaciones especiales

Ejemplo:

Levetiracetam

1500 mg

Cada 12 horas

7:00 AM

7:00 PM

Duración indefinida.

---

# 2. Presentación Comercial

La presentación representa lo que el paciente compra.

Ejemplo:

Levetiracetam

1000 mg

Caja con 30 tabletas

Laboratorio

Lote

Caducidad

Precio

Farmacia

La presentación puede cambiar sin modificar la prescripción.

---

# 3. Conversión Automática de Dosis

El sistema deberá convertir automáticamente la dosis médica a unidades administrables.

Ejemplo:

Prescripción:

1500 mg

Presentación:

1000 mg por tableta

Resultado:

1.5 tabletas por toma.

---

# 4. Tabletas Fraccionadas

El sistema deberá soportar:

- 0.25 tableta
- 0.5 tableta
- 0.75 tableta
- 1.5 tabletas
- 2.5 tabletas

Caso real:

Roberto toma:

1500 mg por la mañana

1500 mg por la noche

Compra:

Levetiracetam 1000 mg

El sistema calcula automáticamente:

1.5 tabletas por toma.

---

# 5. Unidades Administrables

El sistema no deberá limitarse a tabletas.

Debe soportar:

- Tableta
- Media tableta
- Cuarto de tableta
- Cápsula
- Gota
- mL
- Ampolleta
- Inyección
- Parche
- Puff de inhalador
- Sobre
- Solución oral
- Suspensión
- Crema
- Gel

---

# 6. Inventario del Paciente

El paciente podrá registrar:

- Cantidad comprada
- Presentación
- Lote
- Caducidad
- Precio
- Fecha de compra

El sistema calculará automáticamente el inventario restante.

---

# 7. Duración Estimada

El Medication Engine calculará:

- Fecha estimada de agotamiento.
- Días restantes.
- Consumo esperado.
- Consumo real.

Considerando:

- Dosis prescrita
- Confirmaciones
- Omisiones
- Tomas dobles
- Suspensiones
- Nuevas compras

---

# 8. Riesgo de Desabasto

Cuando el medicamento esté próximo a agotarse el sistema podrá:

- Avisar al paciente.
- Avisar al cuidador.
- Avisar al médico.
- Sugerir renovar receta.
- Sugerir comprar medicamento.

---

# 9. Renovación de Receta

El sistema estimará cuándo el tratamiento requiere una nueva receta.

Ejemplo:

Quedan 7 días de medicamento.

No existe receta nueva.

Generar alerta preventiva.

---

# 10. Adherencia Terapéutica

No solamente deberá registrar "Tomó" o "No tomó".

También:

- Confirmó
- Tardó
- Adelantó
- Omitió
- Suspendió por indicación médica
- No tomó porque no tenía medicamento
- Dosis incorrecta
- Dosis duplicada

---

# 11. Indicadores Inteligentes

El Medication Engine deberá calcular:

- Adherencia
- Puntualidad
- Días cubiertos
- Inventario restante
- Fecha de agotamiento
- Riesgo de abandono
- Riesgo de desabasto
- Consumo esperado vs real

---

# 12. Optimización de Compra

El sistema podrá sugerir la presentación más conveniente.

Ejemplo:

Prescripción:

1500 mg

Opciones disponibles:

500 mg

750 mg

1000 mg

El sistema mostrará:

- Tabletas por toma
- Duración de la caja
- Costo por día
- Costo mensual

---

# 13. Casos Especiales

Preparar soporte para:

- Cambios de dosis
- Tapering
- Antibióticos
- Medicamentos PRN
- Días alternos
- Tratamientos por ciclos
- Medicamentos líquidos
- Medicamentos inyectables
- Tratamientos indefinidos

---

# 14. Integración con HELIX Score

HELIX Score deberá considerar:

- Adherencia
- Puntualidad
- Inventario
- Renovaciones
- Omisiones
- Disponibilidad del medicamento

Nunca deberá penalizar automáticamente cuando la causa sea falta de medicamento.

---

# 15. Integración con Patient Timeline

Eventos futuros:

- Tratamiento iniciado
- Dosis confirmada
- Dosis omitida
- Nueva compra
- Medicamento agotado
- Cambio de dosis
- Suspensión
- Renovación

Estos eventos alimentarán la Patient Timeline.

---

# 16. Integración Futura con HELIX AI

HELIX AI podrá utilizar la información del Medication Engine para:

- Detectar riesgo de abandono.
- Detectar patrones.
- Estimar agotamiento.
- Recomendar renovación.
- Detectar errores frecuentes.
- Generar resúmenes clínicos.

---

# 17. Principios de Diseño

El usuario nunca deberá realizar cálculos.

helix deberá hacer todos los cálculos automáticamente.

La experiencia debe ser extremadamente sencilla.

---

# 18. Riesgos

Evitar:

- Confundir prescripción con presentación.
- Hacer compleja la captura.
- Pedir demasiados datos.
- Castigar injustamente al paciente.
- Manejar incorrectamente dosis fraccionadas.
- No considerar cambios de presentación.

---

# 19. Visión Estratégica

El Medication Engine será uno de los pilares tecnológicos de helix.

No será un sistema de recordatorios.

Será un motor inteligente de administración de tratamientos capaz de entender:

- Qué indicó el médico.
- Qué compró el paciente.
- Qué dosis corresponde administrar.
- Cuánto medicamento queda.
- Cuándo se agotará.
- Qué tan bien se sigue el tratamiento.

Este componente será la base para HELIX Score y HELIX AI.

---

# Estado

Documento de visión.

No autoriza implementación.

Antes del desarrollo deberá elaborarse el diseño DDD específico del dominio Medication.