# Architecture Review v1

**Proyecto:** helix

**Rol de revision:** Principal Software Architect - SaaS Healthcare

**Estado:** Pendiente de aprobacion

**Fecha:** 28 de junio de 2026

---

# 0. Alcance de la Revision

Esta revision se basa en la lectura completa de la documentacion ubicada en `helix-docs`:

* README.md
* 00_Project_Vision.md
* 01_Executive_Summary.md
* 02_PRD.md
* 03_System_Architecture.md
* 04_Database.md
* 05_API.md
* 06_UX_UI_Guide.md
* 07_Backlog.md
* 08_Codex.md
* 09_Project_Principles.md
* 10_CHANGELOG.md

No se modifica la vision del producto.  
No se eliminan funcionalidades.  
No se propone desarrollo de codigo en este documento.  

El objetivo es evaluar si la vision, el PRD, la arquitectura, el modelo de datos, la API, la seguridad, la escalabilidad, Google Cloud, UX, costos, riesgos y modelo SaaS estan correctamente alineados para iniciar Sprint 1 con fundamentos solidos.

---

# 1. Fortalezas

## 1.1 Vision de producto clara

helix tiene una definicion fuerte y diferenciada: no es una app de recordatorios, sino una plataforma de continuidad del cuidado del paciente. Esta distincion es importante porque orienta decisiones de producto, datos, seguridad, arquitectura y modelo comercial.

La vision tambien define correctamente un punto de entrada: neurologia, especificamente epilepsia, con expansion futura hacia enfermedades cronicas, clinicas, hospitales, aseguradoras e internacionalizacion.

## 1.2 Principios de producto y arquitectura bien alineados

Los principios documentados son consistentes:

* The patient comes first.
* Be good, then fast.
* Documentation before implementation.
* Security by Design.
* Privacy by Design.
* API First.
* Mobile First.
* Clean Architecture.

Esta base es adecuada para un producto healthcare, donde la confianza, la trazabilidad y la seguridad pesan mas que la velocidad de entrega.

## 1.3 Stack tecnologico razonable para SaaS moderno

El stack propuesto es coherente:

* Next.js, React, TypeScript y PWA para frontend.
* NestJS y TypeScript para backend.
* PostgreSQL / Cloud SQL para datos transaccionales.
* Firestore para eventos dinamicos y notificaciones.
* Cloud Run para despliegue escalable.
* Firebase Authentication y Firebase Messaging para identidad/notificaciones.
* BigQuery para analitica futura.

Es una seleccion pragmatica para MVP y escalamiento progresivo.

## 1.4 Buen enfoque mobile first

El producto esta correctamente orientado a mobile first. Para pacientes, familiares y adultos mayores, la experiencia movil sera el canal principal.

La UX documentada prioriza claridad, acciones rapidas, botones grandes, lenguaje sencillo y WCAG AA. Esto es especialmente relevante para pacientes con baja familiaridad tecnologica o condiciones que afecten su rutina.

## 1.5 Reconocimiento temprano de auditoria y versionado clinico

La documentacion de base de datos incluye:

* Auditoria completa.
* Soft delete.
* Historial de cambios.
* Versionado de informacion clinica.
* Fechas en UTC.
* UUID como llave primaria.

Estos son fundamentos correctos para informacion medica sensible.

## 1.6 Modelo SaaS con multiples rutas de monetizacion

El proyecto contempla:

* Plan gratuito para pacientes.
* Premium individual.
* Licencias para medicos.
* Licencias para clinicas.
* Enterprise hospitalario.
* Programas con aseguradoras.
* Espacios educativos patrocinados claramente identificados.

La estrategia es amplia, pero compatible con la vision de plataforma.

---

# 2. Riesgos

## 2.1 MVP demasiado amplio para el primer ciclo

El MVP documentado incluye autenticacion, usuarios, roles, expediente clinico, medicamentos, recordatorios, sintomas, crisis, agenda, dashboards, HELIX Score, semaforo, modo demo, multiidioma y panel medico.

La vision es correcta, pero el alcance inicial es grande para un primer producto en salud. El riesgo no es conceptual; el riesgo es ejecucion: demasiadas superficies criticas al mismo tiempo pueden retrasar validacion, elevar deuda tecnica y dificultar pruebas de seguridad.

## 2.2 Ambiguedad entre monolito modular y microservicios

La arquitectura describe multiples servicios independientes: Auth Service, Patient Service, Medication Service, Reminder Service, Clinical Record Service, Rules Engine, Reporting Service, entre otros.

Para Sprint 1 y MVP, separar fisicamente cada servicio podria aumentar complejidad operativa, costos, despliegues, observabilidad y seguridad interservicios. La recomendacion es iniciar con un monolito modular en NestJS, con limites de dominio claros, preparado para extraer servicios cuando exista necesidad real.

## 2.3 Datos clinicos sensibles desde el dia uno

El producto manejara informacion altamente sensible:

* Diagnosticos.
* Medicamentos.
* Crisis.
* Sintomas.
* Adjuntos.
* GPS.
* Fotos.
* Videos.
* Datos familiares.
* Datos de medicos.

Esto exige una postura de seguridad, privacidad, consentimiento, auditoria y retencion desde Sprint 1, no como fase futura.

## 2.4 HELIX Score y semaforo pueden ser percibidos como criterio clinico

Aunque la documentacion dice que el HELIX Score no sustituye criterio medico, el producto debe cuidar como se calcula, presenta y explica.

Riesgo: que pacientes, familiares o instituciones interpreten el score como diagnostico, triaje medico o decision clinica automatizada.

## 2.5 Falta definicion de tenancy SaaS

El modelo contempla pacientes, medicos, clinicas, hospitales y aseguradoras, pero aun no define con suficiente precision:

* Organizaciones.
* Tenants.
* Relacion paciente-medico.
* Pacientes compartidos entre organizaciones.
* Separacion de datos.
* Permisos por organizacion.
* Facturacion por tenant.
* Ambientes demo y produccion.

Este punto es fundamental antes de construir usuarios, roles y permisos.

## 2.6 Costo cloud puede crecer antes de validar valor

El stack incluye Cloud SQL, Firestore, Cloud Run, Firebase, Cloud Storage, BigQuery, Logging, Monitoring, Scheduler y posiblemente multiples ambientes.

La plataforma esta bien planteada para escalar, pero si se habilita todo desde el inicio sin limites, presupuestos y observabilidad de costos, el gasto puede crecer antes de lograr traccion.

---

# 3. Oportunidades

## 3.1 Definir un MVP clinico mas validable

Sin eliminar funcionalidades, se recomienda ordenar el MVP por incrementos:

1. Identidad, usuarios, roles, organizaciones y auditoria.
2. Paciente, medicamento, horario y confirmacion de toma.
3. Dashboard paciente con adherencia basica.
4. Registro de crisis.
5. Vista medico minima para seguimiento.
6. HELIX Score v1 explicable.
7. Semaforo v1 basado en reglas simples.

Esto conserva la vision, pero reduce riesgo de ejecucion.

## 3.2 Convertir seguridad en un producto interno

En healthcare, seguridad no debe ser solo checklist tecnico. Debe convertirse en capacidades visibles:

* Consentimientos.
* Control de acceso por relacion.
* Auditoria consultable.
* Politicas de retencion.
* Exportacion de informacion del paciente.
* Revocacion de acceso.
* Historial de cambios clinicos.

Esto puede convertirse en ventaja competitiva frente a apps simples de recordatorios.

## 3.3 Usar PWA para validar antes de apps nativas

La decision PWA es buena para MVP. Permite validar experiencia, adherencia y flujos clinicos antes de invertir en Android/iOS nativo.

Riesgo controlable: las notificaciones push en iOS y Android deben probarse temprano, porque los recordatorios son parte del valor central.

## 3.4 Preparar analitica desde el modelo operacional

BigQuery aparece como futuro receptor de informacion anonimizada. Conviene definir desde el inicio eventos de producto y salud:

* Confirmacion de toma.
* Omision.
* Posposicion.
* Crisis registrada.
* Cambio de tratamiento.
* Consulta programada.
* Acceso de medico.
* Cambio de score.

No es necesario construir analitica avanzada en Sprint 1, pero si conviene modelar eventos auditables y medibles.

## 3.5 Diferenciacion por continuidad del cuidado

La oportunidad central no esta en recordar medicamentos. Esta en cerrar el ciclo:

* El paciente recibe recordatorio.
* El paciente confirma o omite.
* El sistema detecta desviacion.
* El familiar o medico recibe contexto si corresponde.
* El medico revisa tendencia.
* El tratamiento se ajusta con mejor informacion.

Ese ciclo debe guiar el roadmap.

---

# 4. Cambios Recomendados

## 4.1 Definir arquitectura inicial como monolito modular

Recomendacion:

* Mantener los dominios documentados como modulos.
* No desplegar cada dominio como microservicio en Sprint 1.
* Usar NestJS con modulos internos, boundaries claros y contratos de aplicacion.
* Separar por capas: presentation, application, domain, infrastructure.
* Preparar extraccion futura de Reminder Service, Notification Service y Reporting Service cuando la escala lo justifique.

Beneficio:

* Menor complejidad operativa.
* Menor costo.
* Mas velocidad sin sacrificar arquitectura.
* Mejor consistencia transaccional inicial.

## 4.2 Definir modelo de tenancy antes de implementar roles

Antes de construir permisos, se debe definir:

* Organization.
* Organization Membership.
* Patient Ownership.
* Physician-Patient Relationship.
* Family/Caregiver Authorization.
* Role global vs role por organizacion.
* Scope de acceso por paciente.

Esto evita reconstruir autorizacion despues.

## 4.3 Formalizar consentimiento y autorizaciones

Agregar al modelo funcional:

* Consentimiento del paciente para compartir informacion.
* Revocacion de acceso.
* Vigencia de autorizaciones.
* Auditoria de acceso a expediente.
* Diferentes niveles de acceso para familiar, cuidador, medico y asistente.

## 4.4 Definir HELIX Score v1 como indicador explicable

HELIX Score v1 debe ser:

* Deterministico.
* Explicable.
* Versionado.
* Auditable.
* No diagnostico.
* Acompanado de texto claro.

Cada calculo debe guardar:

* Version de formula.
* Datos usados.
* Fecha de calculo.
* Motivos principales del resultado.

## 4.5 Definir reglas de recordatorios como dominio critico

Reminder Queue no debe ser una cola informal. Debe tener:

* Estados claros.
* Idempotencia.
* Reintentos.
* Cancelacion por cambio de tratamiento.
* Tolerancia a zona horaria.
* Registro de envio.
* Registro de entrega si el proveedor lo permite.
* Manejo de ventanas de toma.

## 4.6 Separar auditoria de logs tecnicos

Cloud Logging no sustituye Audit Log clinico.

Se recomienda distinguir:

* Logs tecnicos: errores, latencia, trazas, infraestructura.
* Audit Log de negocio: quien vio, creo, cambio, elimino logicamente o compartio informacion clinica.

## 4.7 Definir una politica de adjuntos

Antes de permitir fotos, videos, PDFs y estudios:

* Tipos permitidos.
* Tamano maximo.
* Antivirus/malware scanning.
* Clasificacion de sensibilidad.
* URLs firmadas.
* Expiracion de acceso.
* Cifrado.
* Retencion.
* Eliminacion logica.

---

# 5. Riesgos Tecnicos

## 5.1 Complejidad de sincronizar Cloud SQL y Firestore

Usar Cloud SQL y Firestore es razonable, pero requiere reglas claras:

* Cloud SQL debe ser fuente de verdad para informacion transaccional y clinica estructurada.
* Firestore debe usarse para estados dinamicos, notificaciones o vistas optimizadas.
* No duplicar informacion critica sin estrategia de consistencia.

Riesgo: divergencia entre datos transaccionales y datos dinamicos.

## 5.2 Recordatorios dependientes de zona horaria

El sistema almacena fechas en UTC, correcto. Pero medicamentos y recordatorios dependen de la zona horaria del paciente.

Se debe definir:

* Timezone por paciente.
* Cambios de timezone por viaje.
* Horarios locales.
* Horario de verano donde aplique.
* Reprogramacion al cambiar tratamiento.

## 5.3 Push notifications no garantizan entrega

Firebase Messaging ayuda, pero una notificacion push no garantiza que el paciente la vea.

El producto debe considerar:

* Confirmacion dentro de la app.
* Reintentos.
* Escalamiento.
* Email como respaldo.
* Futuro SMS/WhatsApp.
* Indicador de recordatorios no confirmados.

## 5.4 Falta especificacion de permisos granulares

RBAC es necesario, pero probablemente insuficiente. Healthcare necesita RBAC + ABAC:

* Rol.
* Organizacion.
* Relacion con paciente.
* Consentimiento vigente.
* Tipo de dato.
* Proposito de acceso.

## 5.5 API aun esta en nivel catalogo

La API documenta recursos y acciones generales, pero faltan contratos concretos:

* DTOs.
* Codigos de error.
* Validaciones.
* Idempotency keys para acciones sensibles.
* Paginacion cursor-based para eventos grandes.
* Filtros por tenant.
* Politica de rate limits.
* Versionado de breaking changes.

## 5.6 Observabilidad clinico-operativa insuficiente

Se documenta Cloud Logging y Monitoring, pero el producto necesita metricas especificas:

* Recordatorios generados.
* Recordatorios enviados.
* Recordatorios fallidos.
* Confirmaciones.
* Omisiones.
* Latencia de alertas.
* Fallas por proveedor.
* Pacientes con riesgo alto sin seguimiento.

---

# 6. Riesgos de Negocio

## 6.1 Mercado con multiples compradores

helix sirve a pacientes, familiares, medicos, clinicas, hospitales y aseguradoras. Cada segmento tiene necesidades, ciclos de venta y disposicion de pago diferentes.

Riesgo: construir una plataforma amplia sin validar primero quien paga, quien decide y quien usa diariamente.

## 6.2 Medicos tienen poco tiempo

El dashboard medico debe ahorrar tiempo de forma evidente. Si genera mas trabajo administrativo, la adopcion sera baja.

La propuesta para medicos debe enfocarse en:

* Pacientes que requieren atencion.
* Alertas priorizadas.
* Resumen rapido.
* Tendencias.
* Preparacion de consulta.

## 6.3 Responsabilidad percibida ante alertas

Si el sistema detecta riesgo rojo, los usuarios pueden esperar intervencion inmediata.

Se debe definir desde producto y legal:

* Que significa una alerta.
* Quien la recibe.
* Que SLA aplica, si aplica.
* Que no es monitoreo medico 24/7, salvo que exista contrato especifico.

## 6.4 Contenido patrocinado en salud

Los espacios educativos patrocinados pueden ser una linea de negocio, pero deben manejarse con maxima transparencia para no comprometer confianza.

Recomendacion:

* Separacion clara entre educacion, publicidad y recomendaciones clinicas.
* Etiquetado visible.
* Revision medica del contenido.
* Politica editorial.

## 6.5 Internacionalizacion temprana puede distraer

Multiidioma es parte de la vision, pero soportar muchos idiomas desde el MVP puede elevar costo de contenido, QA, soporte y UX.

Recomendacion: construir la arquitectura i18n desde el inicio, pero lanzar con pocos idiomas prioritarios.

---

# 7. Mejoras para el MVP

## 7.1 Definir MVP operativo por flujo principal

El flujo MVP debe probar el ciclo esencial:

1. Paciente se registra.
2. Crea o recibe un tratamiento.
3. Programa medicamentos.
4. Recibe recordatorio.
5. Confirma, pospone u omite.
6. Registra crisis si ocurre.
7. Ve su adherencia.
8. Medico revisa seguimiento basico.

Este flujo valida continuidad del cuidado sin desarrollar toda la plataforma completa.

## 7.2 Priorizar datos minimos clinicos

Para MVP, capturar solo los datos clinicos necesarios para medicamentos, crisis y seguimiento.

No eliminar expediente clinico; implementarlo por fases:

* Fase inicial: datos personales, diagnostico principal, alergias criticas, medicamentos, medico tratante.
* Fase posterior: antecedentes, cirugias, vacunas, documentos, estudios y notas avanzadas.

## 7.3 Modo Demo como herramienta comercial y de QA

Modo Demo es una excelente decision. Debe servir para:

* Mostrar valor sin registro.
* Entrenar medicos.
* Probar flujos.
* Validar UX.
* Hacer demos comerciales.

Debe estar totalmente separado de datos reales.

## 7.4 Definir criterios de exito medibles

El MVP debe tener metricas claras:

* Pacientes que completan registro.
* Pacientes que crean tratamiento.
* Tasa de confirmacion de tomas.
* Tasa de omision.
* Uso semanal.
* Crisis registradas.
* Medicos que consultan dashboard.
* Tiempo para confirmar medicamento.
* Retencion a 7, 30 y 90 dias.

## 7.5 Incluir accesibilidad desde primer prototipo

WCAG AA debe probarse desde Sprint 1:

* Contraste.
* Tamano de texto.
* Navegacion por teclado.
* Labels.
* Lectores de pantalla.
* Estados de error claros.

---

# 8. Recomendaciones de Arquitectura

## 8.1 Arquitectura propuesta para Sprint 1

Recomendacion:

* Frontend PWA en Next.js.
* Backend NestJS como monolito modular.
* PostgreSQL en Cloud SQL como fuente de verdad.
* Firestore solo donde aporte valor claro en tiempo real o mensajeria.
* Firebase Authentication integrado con usuarios internos.
* Cloud Run para backend.
* Cloud Storage para adjuntos cuando entren al alcance.
* GitHub Actions para CI/CD.

## 8.2 Modulos iniciales recomendados

Sprint 1 debe concentrarse en:

* Auth.
* Users.
* Roles.
* Permissions.
* Organizations.
* Memberships.
* Audit Log.
* Base Dashboard.

Estos modulos son la base correcta para todo lo demas.

## 8.3 Dominios que deben quedar preparados, no completos

Desde Sprint 1 se deben reservar boundaries para:

* Patients.
* Medical Records.
* Medications.
* Reminders.
* Clinical Events.
* Notifications.
* Rules Engine.
* Reporting.

No todos deben implementarse aun, pero la estructura debe evitar acoplamientos dificiles de romper.

## 8.4 Contratos internos claros

Cada modulo debe definir:

* Casos de uso.
* Entidades de dominio.
* Repositorios.
* DTOs.
* Politicas de autorizacion.
* Eventos de dominio relevantes.

## 8.5 Estrategia de eventos

Para evitar acoplamiento, se recomienda preparar eventos de dominio:

* UserRegistered.
* PatientCreated.
* MedicationScheduled.
* IntakeConfirmed.
* IntakeSkipped.
* CrisisRegistered.
* RiskEvaluated.
* AccessGranted.
* AccessRevoked.

En MVP pueden ser eventos internos; mas adelante podrian publicarse a Pub/Sub.

## 8.6 Estrategia de datos

Cloud SQL debe manejar:

* Usuarios internos.
* Organizaciones.
* Roles y permisos.
* Pacientes.
* Expediente estructurado.
* Medicamentos.
* Confirmaciones.
* Auditoria de negocio.

Firestore puede manejar:

* Estados dinamicos.
* Notificaciones.
* Preferencias ligeras.
* Vistas optimizadas si se justifica.

BigQuery debe esperar hasta tener eventos limpios y politica de anonimization/pseudonymization.

---

# 9. Recomendaciones de Seguridad

## 9.1 Seguridad minima obligatoria desde Sprint 1

Sprint 1 debe incluir:

* Autenticacion segura.
* RBAC inicial.
* Modelo de permisos por organizacion.
* Auditoria de acciones sensibles.
* Validacion server-side.
* Sanitizacion.
* HTTPS.
* Secret Manager.
* Cifrado en transito y reposo.
* Politica de sesiones y refresh tokens.
* Separacion de ambientes.

## 9.2 Autorizacion por relacion, no solo por rol

Un medico no debe ver cualquier paciente por ser medico. Debe existir relacion autorizada.

Un familiar no debe ver cualquier informacion por ser familiar. Debe existir consentimiento del paciente y scope de acceso.

## 9.3 Proteccion de datos clinicos

Recomendaciones:

* Minimizar datos recolectados.
* Clasificar datos sensibles.
* Enmascarar informacion en logs.
* No registrar payloads clinicos completos en logs tecnicos.
* Cifrar adjuntos.
* Usar URLs firmadas para archivos.
* Controlar exportaciones.
* Registrar accesos a expediente.

## 9.4 Cumplimiento regulatorio

El producto debe prepararse para operar bajo regulaciones de privacidad y salud segun mercado objetivo. Sin asumir asesoria legal, la arquitectura debe contemplar:

* Consentimiento informado.
* Derecho de acceso del paciente.
* Rectificacion de datos no clinicos.
* Portabilidad/exportacion.
* Retencion de expediente.
* Revocacion de permisos.
* Trazabilidad de accesos.
* Acuerdos con proveedores cloud y terceros.

Si helix opera en Estados Unidos, debe revisarse postura HIPAA segun tipo de cliente y relacion contractual. En Mexico y Latinoamerica, deben revisarse leyes de proteccion de datos personales y reglas aplicables a informacion sensible. En Europa, GDPR debe considerarse si hay usuarios o entidades europeas.

## 9.5 Seguridad de API

Agregar desde el estandar API:

* Rate limiting.
* Idempotency keys para operaciones criticas.
* Request IDs.
* Correlation IDs.
* Error codes estandarizados.
* Validacion estricta de entrada.
* Proteccion contra enumeration.
* Politicas CORS.
* Rotacion de secretos.
* Pruebas de autorizacion.

## 9.6 Auditoria

Audit Log debe registrar:

* Quien hizo la accion.
* A que paciente o entidad afecto.
* Desde que organizacion.
* Fecha/hora.
* IP/dispositivo.
* Resultado.
* Motivo si aplica.

Debe evitar guardar informacion clinica innecesaria dentro del log.

---

# 10. Recomendaciones para el Sprint 1

## 10.1 Objetivo del Sprint 1

Construir la base segura y escalable del SaaS antes de entrar a flujos clinicos complejos.

Resultado esperado:

* Una plataforma base donde usuarios, roles, permisos, organizaciones y auditoria funcionen correctamente.
* Frontend minimo con login, registro, perfil, navegacion y dashboard base.
* Infraestructura inicial reproducible.

## 10.2 Alcance recomendado

Backend:

* Auth.
* Users.
* Roles.
* Permissions.
* Organizations.
* Organization Memberships.
* Audit Log.
* Health Check.

Frontend:

* Login.
* Registro.
* Recuperacion de contrasena.
* Perfil.
* Navegacion principal.
* Dashboard base.
* Selector de idioma preparado.

Infraestructura:

* Docker.
* Cloud Run preparado.
* Cloud SQL preparado.
* Firebase Authentication.
* Firestore preparado.
* Secret Manager.
* GitHub Actions.
* Ambientes development y staging como minimo.

Calidad:

* Pruebas unitarias para casos de uso criticos.
* Pruebas de autorizacion.
* Lint/typecheck.
* Swagger/OpenAPI inicial.
* README tecnico de ejecucion.

## 10.3 Decisiones que deben cerrarse antes de programar

Antes de iniciar implementacion, aprobar:

* Monolito modular vs microservicios fisicos.
* Modelo de tenant/organization.
* Relacion usuario-paciente-medico-familiar.
* Estrategia Firebase Auth + usuario interno.
* Estructura de permisos.
* Politica inicial de auditoria.
* Ambientes iniciales.
* Politica de datos demo.
* Estrategia de i18n inicial.

## 10.4 Criterios de aceptacion de Sprint 1

Sprint 1 deberia aceptarse cuando:

* Un usuario puede registrarse e iniciar sesion.
* Un usuario tiene perfil.
* Un usuario pertenece a una organizacion o contexto definido.
* Roles y permisos se validan en backend.
* Acciones sensibles generan audit log.
* El frontend no contiene logica de negocio critica.
* Swagger expone contratos iniciales.
* El sistema puede correr localmente con Docker.
* Existe pipeline CI basico.
* Secrets no estan hardcodeados.
* Hay separacion clara entre ambientes.

---

# 11. Costos y Google Cloud

## 11.1 Enfoque recomendado de costos

Para MVP, optimizar por simplicidad y control:

* Cloud Run con min instances en cero para ambientes no productivos.
* Cloud SQL con instancia pequena inicial.
* Firestore con uso limitado y justificado.
* Cloud Storage con politicas de lifecycle.
* Logging con retencion controlada.
* BigQuery diferido hasta tener eventos anonimizados utiles.

## 11.2 Presupuestos y alertas

Antes de produccion:

* Definir budgets por proyecto GCP.
* Alertas al 50%, 75%, 90% y 100%.
* Separar billing por ambiente si es posible.
* Etiquetar recursos por ambiente y modulo.

## 11.3 Riesgos de costo

Los principales generadores potenciales de costo seran:

* Cloud SQL siempre encendido.
* Firestore con lecturas/escrituras frecuentes.
* Cloud Storage por videos y estudios.
* Egress de archivos.
* Logging excesivo.
* BigQuery si se ingestan eventos sin control.

---

# 12. Modelo SaaS

## 12.1 Modelo recomendado

helix debe nacer como SaaS multi-tenant con soporte para:

* Usuarios individuales.
* Medicos independientes.
* Clinicas.
* Hospitales.
* Aseguradoras.
* Modo demo.

## 12.2 Tenancy

Recomendacion inicial:

* Una base compartida con `organization_id` y controles estrictos de acceso.
* Separacion logica por tenant.
* Auditoria por tenant.
* Preparacion futura para aislamiento fisico en clientes enterprise si se requiere.

## 12.3 Planes

Los planes pueden evolucionar asi:

* Free: paciente individual con funcionalidades basicas.
* Premium: paciente/familia con seguimiento avanzado.
* Physician: medico con panel de pacientes.
* Clinic: multiples medicos, asistentes y pacientes.
* Enterprise: hospitales, integraciones, SLA y soporte avanzado.
* Payer/Insurance: programas poblacionales y analitica agregada.

## 12.4 Feature flags

Se recomienda incorporar feature flags temprano para:

* Activar modulos por plan.
* Activar modo demo.
* Probar HELIX Score v1.
* Separar clientes piloto.
* Controlar despliegues graduales.

---

# 13. Evaluacion General

helix tiene una vision fuerte, una propuesta de valor relevante y una arquitectura base razonable para convertirse en una plataforma SaaS healthcare.

La principal recomendacion no es reducir la ambicion, sino secuenciarla mejor. El proyecto debe proteger desde el inicio tres cosas:

1. Confianza del paciente.
2. Integridad de los datos clinicos.
3. Capacidad de evolucionar sin reescrituras tempranas.

El mayor riesgo tecnico es intentar implementar demasiados dominios al mismo tiempo o distribuirlos prematuramente como microservicios. El mayor riesgo de negocio es no validar rapidamente quien obtiene valor diario y quien paga.

La mejor ruta para Sprint 1 es construir una base SaaS segura: identidad, organizacion, permisos, auditoria, frontend base, CI/CD e infraestructura minima. Sobre esa base, el producto puede avanzar hacia medicamentos, recordatorios, crisis, dashboard medico, HELIX Score y semaforo con menos deuda y mayor confianza.

---

# 14. Decision Recomendada

Recomendacion: aprobar el inicio de Sprint 1 solo despues de cerrar las decisiones de arquitectura base listadas en este documento.

Decision sugerida:

* Aprobar monolito modular para MVP.
* Aprobar modelo SaaS multi-tenant logico.
* Aprobar Sprint 1 enfocado en Auth, Users, Roles, Permissions, Organizations, Audit Log, Dashboard Base e infraestructura.
* Diferir microservicios fisicos hasta que existan necesidades reales de escala o autonomia operativa.
* Diferir BigQuery productivo hasta tener eventos anonimizados bien definidos.
* Mantener PWA como canal principal para validacion inicial.

---

# 15. Pendiente de Aprobacion

Este documento queda listo para revision.

No se debe iniciar desarrollo hasta recibir aprobacion explicita.
