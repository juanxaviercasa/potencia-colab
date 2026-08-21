# Colab Atelier

**Colab Atelier** es un centro personal de entrenamiento para desarrollar criterio de ingeniería de datos con Google Colab, laboratorios reproducibles, notas privadas, mentoría IA y evidencia de portafolio.

La aplicación está diseñada para un solo propietario autenticado. No es una plataforma multiusuario ni un sistema para publicar datos de terceros.

## Capacidades

| Área | Qué incluye |
|---|---|
| Ruta de dominio | 24 misiones prácticas en sistemas Colab, calidad, ingesta ética, pipelines, IA aplicada y valor de datos. |
| Laboratorios | Plantillas de código copiables y exportables como notebooks `.ipynb`. |
| Importaciones | Carga privada de CSV, JSON y Parquet de hasta 10 MB, con previsualización local para CSV/JSON. |
| Portafolio | Brief, entregable, evidencia, avance y rúbrica para proyectos técnicos verificables. |
| Catálogo | APIs y bases de datos con documentación oficial, guardrails y snippets de Colab. |
| Operación personal | Notas Markdown, progreso, hitos y mentoría IA con contexto de sesiones previas. |

## Seguridad y límites

> Google Colab es un entorno de experimentación. Sus runtimes son temporales y no deben utilizarse para hosting ni automatización persistente. Conserva notebooks y artefactos importantes fuera de la VM. [1]

Las importaciones se guardan en almacenamiento privado asociado a la sesión del propietario. No subas secretos, credenciales, datos financieros, listas de clientes ni datos personales innecesarios. Para pruebas, usa datos anonimizados y fuentes autorizadas.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

Para validar el proyecto:

```bash
pnpm check
pnpm test
```

## Personalización rápida

| Necesidad | Archivo |
|---|---|
| Lecciones, recursos y playbooks | `client/src/lib/academy.ts` |
| Catálogo de APIs y bases de datos | `client/src/lib/dataCatalog.ts` |
| Importaciones y portafolio | `client/src/pages/DataOperationsPages.tsx` |
| Catálogo interactivo | `client/src/pages/CatalogPage.tsx` |
| Acceso a datos y routers | `server/db.ts` y `server/routers.ts` |
| Almacenamiento de importaciones | `server/importRoutes.ts` y `server/storage.ts` |
| Esquema de base de datos | `drizzle/schema.ts` |

Consulta [`GUIA_COPIAR_Y_PERSONALIZAR.md`](./GUIA_COPIAR_Y_PERSONALIZAR.md) para snippets de Colab y placeholders.

## Referencias

[1] [Google Colab — Preguntas frecuentes](https://research.google.com/colaboratory/faq.html)


## Presentación profesional

Potencia Colab demuestra una aplicación de aprendizaje y operaciones de datos con autenticación, importaciones privadas, progreso, notas, catálogo técnico y mentoría asistida. Su valor para un reclutador está en el tratamiento responsable del flujo de datos, no en presentar Google Colab como infraestructura de producción.

## Evidencia de ingeniería

El repositorio contiene rutas de importación, almacenamiento, routers, esquema Drizzle, validaciones y pruebas. La documentación debe acompañar cada flujo con el modelo de amenaza, límites de archivo, tipos MIME aceptados, estrategia de borrado y política de datos de demostración. Los secretos y datos personales deben quedar fuera de fixtures y capturas.

## Próxima evolución

La siguiente mejora recomendable es añadir un diagrama de arquitectura, una matriz de permisos, pruebas E2E de importación, un workflow CI visible y métricas de rendimiento con archivos de 1 MB, 5 MB y 10 MB. Esto convierte el proyecto en una demostración comprobable de backend, datos, seguridad y calidad.

## Caso para reclutadores

Este proyecto complementa el backend Python de Pymes Inside Platform: aquí se observa la experiencia con TypeScript, persistencia, autenticación, almacenamiento privado y flujos de datos para aprendizaje.
