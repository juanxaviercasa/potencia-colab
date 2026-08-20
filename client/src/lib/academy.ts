export type Lesson = {
  id: string;
  title: string;
  level: "Fundamento" | "Construcción" | "Escala" | "Dominio";
  duration: string;
  outcome: string;
  action: string;
  checklist: string[];
  snippet: string;
};

export type Track = {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  color: "cyan" | "violet" | "amber" | "emerald" | "rose" | "blue";
  competency: string;
  lessons: Lesson[];
};

const baseBoot = `# Celda 0 — Bootstrap reproducible
!pip -q install -U pandas pyarrow duckdb

import os, sys, platform, pandas as pd
from pathlib import Path

PROJECT = Path("/content/{{NOMBRE_PROYECTO}}")
DATA = PROJECT / "data"
OUTPUT = PROJECT / "output"
for folder in (DATA, OUTPUT):
    folder.mkdir(parents=True, exist_ok=True)

print({"python": sys.version.split()[0], "platform": platform.platform()})`;

export const tracks: Track[] = [
  {
    id: "sistemas-colab",
    number: "01",
    title: "Sistemas de trabajo con Colab",
    shortTitle: "Sistemas & Colab",
    description: "Convierte un notebook efímero en un entorno de experimentación reproducible, medible y seguro.",
    color: "cyan",
    competency: "Diseñar experimentos reproducibles sobre infraestructura temporal.",
    lessons: [
      { id: "colab-runtime", title: "Runtime como laboratorio efímero", level: "Fundamento", duration: "35 min", outcome: "Diferencias RAM, disco temporal, Drive y artefactos versionados.", action: "Construye un mapa de qué persiste y qué debes exportar al cerrar sesión.", checklist: ["Verificar acelerador solo si la carga lo usa", "Crear estructura /content de proyecto", "Guardar artefactos fuera del runtime"], snippet: baseBoot },
      { id: "colab-bootstrap", title: "Bootstrap parametrizado", level: "Fundamento", duration: "50 min", outcome: "Una primera celda que prepara librerías, rutas y configuración.", action: "Crea tu plantilla base y ejecútala desde un notebook nuevo.", checklist: ["Fijar versiones críticas", "Separar data, output y notebooks", "Imprimir entorno y fecha"], snippet: baseBoot },
      { id: "colab-observability", title: "Observabilidad de experimentos", level: "Construcción", duration: "45 min", outcome: "Medición de filas, nulos, tiempos y costos de cómputo.", action: "Instrumenta un pipeline de muestra con métricas antes/después.", checklist: ["Medir filas de entrada y salida", "Registrar duración", "Validar una regla de calidad"], snippet: `import time
started = time.perf_counter()

# {{TU_TRANSFORMACION}}

elapsed = time.perf_counter() - started
print({"rows": "{{FILAS_SALIDA}}", "seconds": round(elapsed, 2)})` },
      { id: "colab-production-boundary", title: "Límite prototipo → producción", level: "Dominio", duration: "40 min", outcome: "Criterios claros para dejar Colab y mover un flujo a infraestructura gestionada.", action: "Redacta una decisión de arquitectura con disparadores de migración.", checklist: ["Definir propietario operativo", "Definir SLA", "Definir ubicación de secretos y datos"], snippet: `decision = {
  "prototype_goal": "{{HIPOTESIS_A_VALIDAR}}",
  "production_trigger": "{{VOLUMEN_O_FRECUENCIA}}",
  "target_runtime": "{{SERVICIO_GESTIONADO}}",
}
decision` },
    ],
  },
  {
    id: "datos-calidad",
    number: "02",
    title: "Modelado, SQL y calidad de datos",
    shortTitle: "Datos & Calidad",
    description: "Aprende a construir activos de datos confiables en lugar de hojas y scripts inconexos.",
    color: "violet",
    competency: "Modelar entidades, métricas y contratos que soporten decisiones.",
    lessons: [
      { id: "data-grain", title: "Grano antes que consulta", level: "Fundamento", duration: "35 min", outcome: "Definición precisa de qué representa una fila antes de usar SQL.", action: "Escribe el grano de una tabla de campañas, clientes o inventario.", checklist: ["Nombrar entidad", "Definir una fila", "Anotar clave candidata"], snippet: `# Una fila representa: {{DEFINICION_DE_GRANO}}
grain = "{{EJ: una interacción por post, red y día}}"
primary_key = ["{{CAMPO_1}}", "{{CAMPO_2}}"]` },
      { id: "data-duckdb", title: "SQL local con DuckDB", level: "Construcción", duration: "55 min", outcome: "Consulta de CSV/Parquet sin levantar infraestructura adicional.", action: "Agrupa un archivo de eventos y guarda un agregado confiable.", checklist: ["Leer desde una ruta explícita", "Filtrar registros inválidos", "Exportar Parquet"], snippet: `import duckdb

query = """
SELECT {{DIMENSION}}, COUNT(*) AS eventos
FROM read_parquet('{{RUTA_ARCHIVO}}')
GROUP BY 1
ORDER BY eventos DESC
"""
result = duckdb.sql(query).df()
result.head()` },
      { id: "data-quality-contract", title: "Contratos de calidad", level: "Escala", duration: "50 min", outcome: "Validaciones mínimas para detectar datos silenciosamente rotos.", action: "Crea tres reglas de calidad para una fuente real.", checklist: ["Unicidad de clave", "Rango válido", "Cobertura mínima"], snippet: `def check_data(df):
    assert df["{{ID}}"].notna().all(), "Hay claves vacías"
    assert df["{{ID}}"].is_unique, "Hay claves duplicadas"
    assert df["{{METRICA}}"].ge(0).all(), "Hay valores negativos"
    return "quality gates passed"` },
      { id: "data-semantic-layer", title: "Capa semántica de negocio", level: "Dominio", duration: "45 min", outcome: "Métricas que no cambian de significado entre análisis y canales.", action: "Documenta una métrica crítica con fórmula, ventana y exclusiones.", checklist: ["Fórmula exacta", "Fuente propietaria", "Decisión que habilita"], snippet: `metric = {
  "name": "{{NOMBRE_METRICA}}",
  "formula": "{{NUMERADOR}} / {{DENOMINADOR}}",
  "grain": "{{GRANO}}",
  "decision": "{{DECISION_QUE_INFORMA}}",
}` },
    ],
  },
  {
    id: "ingesta-etica",
    number: "03",
    title: "Ingesta ética y señales de mercado",
    shortTitle: "Ingesta Ética",
    description: "Recolecta datos públicos o autorizados con trazabilidad, límites y respeto por las reglas de cada fuente.",
    color: "emerald",
    competency: "Diseñar adquisición de datos auditable y respetuosa de permisos.",
    lessons: [
      { id: "ingest-source-map", title: "Mapa de fuentes y permisos", level: "Fundamento", duration: "30 min", outcome: "Una matriz de origen, permiso, frecuencia, titular y uso permitido.", action: "Clasifica tres fuentes que quieras analizar.", checklist: ["Revisar términos", "Definir finalidad", "Excluir datos personales"], snippet: `source_register = {
  "source": "{{URL_O_API}}",
  "permission": "{{PUBLICA_O_AUTORIZADA}}",
  "purpose": "{{PREGUNTA_DE_NEGOCIO}}",
  "rate_limit": "{{LIMITE}}",
}` },
      { id: "ingest-api", title: "Cliente API tolerante a fallos", level: "Construcción", duration: "55 min", outcome: "Peticiones con timeout, reintento limitado y almacenamiento de respuesta cruda.", action: "Conecta una API documentada usando tu propia clave de entorno.", checklist: ["No pegar claves en celdas", "Aplicar timeout", "Guardar fecha de extracción"], snippet: `import os, requests

url = "{{ENDPOINT_DOCUMENTADO}}"
headers = {"Authorization": f"Bearer {os.environ.get('{{NOMBRE_SECRETO}}', '')}"}
response = requests.get(url, headers=headers, timeout=20)
response.raise_for_status()
payload = response.json()` },
      { id: "ingest-public-web", title: "Extracción de página pública", level: "Escala", duration: "45 min", outcome: "Un colector mínimo para una página permitida, con identificación y baja frecuencia.", action: "Extrae un título y precios publicados de una sola URL autorizada.", checklist: ["Comprobar robots.txt y términos", "Una URL por prueba", "No evadir logins, CAPTCHAs o límites"], snippet: `import requests
from bs4 import BeautifulSoup

url = "{{URL_PUBLICA_PERMITIDA}}"
response = requests.get(url, headers={"User-Agent": "{{TU_CONTACTO_O_PROYECTO}}"}, timeout=20)
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")
print(soup.title.get_text(strip=True))` },
      { id: "ingest-lineage", title: "Linaje y datos crudos", level: "Dominio", duration: "35 min", outcome: "Cualquier tabla analítica puede rastrearse hasta la extracción y transformación original.", action: "Crea un manifiesto de tu siguiente extracción.", checklist: ["ID de corrida", "Hash o ruta cruda", "Transformación responsable"], snippet: `run_manifest = {
  "run_id": "{{YYYYMMDD_HHMM}}",
  "source_url": "{{FUENTE}}",
  "raw_path": "{{RUTA_CRUDA}}",
  "transform_version": "{{GIT_COMMIT_O_VERSION}}",
}` },
    ],
  },
  {
    id: "pipelines",
    number: "04",
    title: "Pipelines y automatización avanzada",
    shortTitle: "Pipelines",
    description: "Pasa de celdas manuales a flujos modulares, idempotentes y pensados para escalar fuera de Colab.",
    color: "amber",
    competency: "Descomponer procesos en etapas verificables y repetibles.",
    lessons: [
      { id: "pipeline-design", title: "Diseño de pipeline por contratos", level: "Fundamento", duration: "40 min", outcome: "Entrada, transformación, salida y condición de éxito por cada etapa.", action: "Dibuja tu pipeline de una fuente a una decisión.", checklist: ["Input explícito", "Output versionado", "Criterio de éxito"], snippet: `pipeline = [
  {"stage": "extract", "input": "{{FUENTE}}", "output": "raw.parquet"},
  {"stage": "transform", "input": "raw.parquet", "output": "clean.parquet"},
  {"stage": "serve", "input": "clean.parquet", "output": "metricas.csv"},
]` },
      { id: "pipeline-idempotency", title: "Idempotencia práctica", level: "Construcción", duration: "50 min", outcome: "Reejecutar sin duplicar ni corromper información.", action: "Añade una partición de fecha y estrategia de reemplazo a un flujo.", checklist: ["Identificador de corrida", "Reemplazo atómico", "Deduplicación"], snippet: `from pathlib import Path

target = Path("{{OUTPUT}}/{{PARTICION}}.parquet")
tmp = target.with_suffix(".tmp.parquet")
df.to_parquet(tmp, index=False)
tmp.replace(target)  # reemplazo al terminar con éxito` },
      { id: "pipeline-content", title: "Pipeline de contenido con revisión humana", level: "Escala", duration: "55 min", outcome: "Un flujo que convierte señales en borradores, nunca publicación automática ciega.", action: "Define pasos de investigación, guion, revisión y distribución manual.", checklist: ["Fuente con permiso", "Revisión de afirmaciones", "Aprobación humana antes de publicar"], snippet: `content_brief = {
  "audience": "{{AUDIENCIA}}",
  "signal": "{{DATO_O_INSIGHT_VALIDADO}}",
  "angle": "{{ANGULO_UTIL}}",
  "human_approval": True,
}` },
      { id: "pipeline-orchestration", title: "Cuándo orquestar fuera de Colab", level: "Dominio", duration: "45 min", outcome: "Un umbral para pasar de notebook a repositorio, scheduler y servicio gestionado.", action: "Define el disparador que justificaría producción.", checklist: ["Frecuencia real", "Riesgo de falla", "Observabilidad requerida"], snippet: `production_readiness = {
  "frequency": "{{DIARIA_SEMANAL_EVENTO}}",
  "retry_policy": "{{DEFINIR}}",
  "owner": "{{RESPONSABLE}}",
  "alert_channel": "{{CANAL_DE_ALERTAS}}",
}` },
    ],
  },
  {
    id: "ia-aplicada",
    number: "05",
    title: "IA aplicada y productos de datos",
    shortTitle: "IA Aplicada",
    description: "Usa modelos para estructurar, analizar y acelerar decisiones; no para sustituir validación humana ni inventar resultados.",
    color: "rose",
    competency: "Diseñar sistemas de IA con evaluación, contexto y supervisión.",
    lessons: [
      { id: "ai-task-design", title: "Diseño de tareas para IA", level: "Fundamento", duration: "35 min", outcome: "Convertir una ambición vaga en una tarea con entrada, salida y criterio de calidad.", action: "Especifica una tarea de clasificación o extracción para tu negocio.", checklist: ["Entrada delimitada", "Salida estructurada", "Criterio de revisión"], snippet: `task = {
  "input": "{{TEXTO_O_DATOS}}",
  "output_schema": {"label": "string", "evidence": "string"},
  "quality_check": "{{REGLA_DE_REVISION}}",
}` },
      { id: "ai-copy-drafts", title: "Borradores de copy con evidencia", level: "Construcción", duration: "45 min", outcome: "Prompts que transforman una fuente en borrador trazable, no en promesas inventadas.", action: "Crea tres ángulos de contenido basados en un insight válido.", checklist: ["Aportar fuente", "Prohibir promesas no verificadas", "Revisión editorial"], snippet: `prompt = """Actúa como editor. Usa únicamente estos hechos: {{HECHOS_VERIFICADOS}}.
Produce 3 ángulos para {{CANAL}}. No inventes cifras, casos ni testimonios.
Incluye la evidencia que respalda cada ángulo."""` },
      { id: "ai-evaluation", title: "Evaluación antes de automatizar", level: "Escala", duration: "55 min", outcome: "Un set de casos para comparar calidad, costo y riesgo de un flujo IA.", action: "Crea 10 ejemplos reales con respuesta esperada y puntúalos.", checklist: ["Casos de borde", "Criterio de fallo", "Muestra humana"], snippet: `evaluation = {
  "case": "{{EJEMPLO_REAL}}",
  "expected": "{{SALIDA_ESPERADA}}",
  "actual": "{{SALIDA_MODELO}}",
  "pass": "{{TRUE_O_FALSE}}",
}` },
      { id: "ai-data-product", title: "Producto de datos con humano en el circuito", level: "Dominio", duration: "50 min", outcome: "Diseño de una herramienta que recomienda, explica incertidumbre y conserva revisión.", action: "Prototipa la interfaz de una recomendación que un usuario pueda auditar.", checklist: ["Explicar fuente", "Mostrar incertidumbre", "Permitir corregir"], snippet: `recommendation = {
  "decision": "{{ACCION_PROPUESTA}}",
  "evidence": ["{{FUENTE_1}}", "{{FUENTE_2}}"],
  "confidence": "{{BAJA_MEDIA_ALTA}}",
  "review_required": True,
}` },
    ],
  },
  {
    id: "valor-distribucion",
    number: "06",
    title: "Valor, distribución y negocios de datos",
    shortTitle: "Valor & Distribución",
    description: "Traduce capacidades técnicas en experimentos de mercado, activos de contenido y ofertas responsables para negocios locales o internacionales.",
    color: "blue",
    competency: "Conectar activos de datos con una decisión de cliente, canal y métrica económica.",
    lessons: [
      { id: "value-problem", title: "Problema antes que herramienta", level: "Fundamento", duration: "35 min", outcome: "Un problema medible que un cliente o audiencia ya intenta resolver.", action: "Formula una hipótesis de dolor, segmento y evidencia.", checklist: ["Cliente específico", "Costo del problema", "Evidencia observable"], snippet: `hypothesis = {
  "segment": "{{QUIEN}}",
  "problem": "{{PROBLEMA_CARO_Y_FRECUENTE}}",
  "evidence": "{{ENTREVISTA_O_DATO_PUBLICO}}",
  "metric": "{{SENAL_DE_VALOR}}",
}` },
      { id: "value-local", title: "Diagnóstico de negocio local", level: "Construcción", duration: "45 min", outcome: "Un análisis de presencia y demanda usando fuentes permitidas y entrevistas.", action: "Elige un tipo de negocio y crea una lista de 10 preguntas de diagnóstico.", checklist: ["Usar fuentes públicas", "No captar datos personales", "Validar con dueño u operador"], snippet: `local_audit = {
  "business_type": "{{NICHO_LOCAL}}",
  "decision": "{{DECISION_A_MEJORAR}}",
  "public_signals": ["{{FUENTE_PUBLICA}}"],
  "validation_call": "{{FECHA}}",
}` },
      { id: "value-content", title: "Distribución basada en activos", level: "Escala", duration: "50 min", outcome: "Una máquina de contenido que reutiliza investigación original, no ruido automatizado.", action: "Convierte un dataset o entrevista en una pieza larga y tres derivadas.", checklist: ["Una fuente primaria", "Una conclusión útil", "Una métrica por canal"], snippet: `distribution_plan = {
  "source_asset": "{{ANALISIS_O_ENTREVISTA}}",
  "long_form": "{{ARTICULO_O_VIDEO}}",
  "derivatives": ["{{POST_1}}", "{{POST_2}}", "{{EMAIL}}"],
  "metric": "{{RESPUESTAS_O_REUNIONES}}",
}` },
      { id: "value-offer", title: "Oferta basada en resultado verificable", level: "Dominio", duration: "55 min", outcome: "Una oferta con alcance, prueba, límites y economía, sin prometer resultados ajenos.", action: "Diseña un piloto de datos de dos semanas con métrica y condición de salida.", checklist: ["Resultado controlable", "Alcance explícito", "Riesgo y salida"], snippet: `pilot_offer = {
  "outcome": "{{ENTREGABLE_MEDIBLE}}",
  "scope": "{{INCLUYE_Y_EXCLUYE}}",
  "proof": "{{EVIDENCIA_A_PRODUCIR}}",
  "decision_gate": "{{CUANDO_ESCALAR_O_DETENER}}",
}` },
    ],
  },
];

export const allLessons = tracks.flatMap((track) =>
  track.lessons.map((lesson) => ({ ...lesson, trackId: track.id, trackTitle: track.shortTitle, color: track.color })),
);

export const resources = [
  { id: "colab-faq", type: "Guía oficial", topic: "Sistemas & Colab", title: "Google Colab: preguntas frecuentes", note: "Límites dinámicos, runtimes efímeros, almacenamiento y actividades restringidas.", href: "https://research.google.com/colaboratory/faq.html" },
  { id: "colab-runtimes", type: "Documentación", topic: "Arquitectura", title: "Runtimes y templates de Colab Enterprise", note: "Modelo mental de VM, persistencia, aislamiento y configuración de runtimes.", href: "https://docs.cloud.google.com/colab/docs/runtimes" },
  { id: "duckdb", type: "Herramienta", topic: "SQL & Analítica", title: "DuckDB documentation", note: "Motor analítico embebido para explorar archivos y prototipos reproducibles.", href: "https://duckdb.org/docs/" },
  { id: "dbt", type: "Guía", topic: "Transformación", title: "dbt Learn", note: "Bases para transformar, probar y documentar modelos de datos fuera del notebook.", href: "https://docs.getdbt.com/docs/introduction" },
  { id: "pandas", type: "Documentación", topic: "Python", title: "pandas user guide", note: "Referencia para transformación tabular, formatos y rendimiento.", href: "https://pandas.pydata.org/docs/user_guide/index.html" },
  { id: "great-expectations", type: "Herramienta", topic: "Calidad", title: "Great Expectations", note: "Patrones y herramientas para expectativas y validaciones de datos.", href: "https://docs.greatexpectations.io/docs/" },
];

export const playbooks = [
  { id: "signal-to-brief", title: "Señal → insight → brief de contenido", stage: "Investigación aplicada", description: "Convierte una fuente autorizada y una pregunta concreta en una pieza editorial revisable.", steps: ["Define una audiencia y decisión", "Captura una fuente pública o autorizada", "Limpia y valida el dato", "Formula una sola observación", "Redacta borrador con evidencia", "Revisión humana y distribución"], metric: "Respuestas calificadas, guardados o reuniones; no métricas vacías." },
  { id: "local-data-pilot", title: "Piloto de datos para un negocio local", stage: "Prueba de valor", description: "Un sprint breve para descubrir una fricción operativa y producir un activo de decisión.", steps: ["Entrevista al operador", "Mapea el proceso y el dato disponible", "Alinea permisos", "Construye un informe o tablero mínimo", "Presenta una decisión accionable", "Define siguiente experimento"], metric: "Tiempo ahorrado, conversión o reducción de error acordada antes del piloto." },
  { id: "ai-quality-loop", title: "Bucle IA con evaluación", stage: "Automatización responsable", description: "Antes de automatizar una tarea, crea un conjunto de pruebas y una salida que un humano pueda auditar.", steps: ["Elige tarea estrecha", "Define formato de salida", "Crea 10 casos reales", "Evalúa fallos", "Agrega guardrails", "Automatiza solo con umbral aceptado"], metric: "Tasa de aprobación humana, costo por salida útil y severidad de fallos." },
];

export function buildNotebook(lesson: Lesson) {
  return JSON.stringify({
    nbformat: 4,
    nbformat_minor: 5,
    metadata: { colab: { name: `${lesson.title}.ipynb`, provenance: [] }, kernelspec: { name: "python3", display_name: "Python 3" } },
    cells: [
      { cell_type: "markdown", metadata: {}, source: [`# ${lesson.title}\n`, `\n`, `**Resultado esperado:** ${lesson.outcome}\n`, `\n`, `> Reemplaza cada marcador {{...}} antes de ejecutar.`] },
      { cell_type: "code", metadata: {}, execution_count: null, outputs: [], source: lesson.snippet.split("\n").map((line) => `${line}\n`) },
    ],
  }, null, 2);
}
