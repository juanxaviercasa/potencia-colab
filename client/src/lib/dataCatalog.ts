export type CatalogItem = {
  id: string;
  kind: "API" | "Base de datos";
  domain: string;
  name: string;
  description: string;
  access: string;
  docsUrl: string;
  endpoint?: string;
  useCase: string;
  guardrail: string;
  code: string;
};

export const dataCatalog: CatalogItem[] = [
  {
    id: "world-bank-indicators",
    kind: "API",
    domain: "Economía & desarrollo",
    name: "World Bank Indicators API",
    description: "Indicadores de desarrollo, economía, población, educación y sostenibilidad para análisis por país y periodo.",
    access: "Acceso público sin API key para el endpoint de indicadores.",
    docsUrl: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation",
    endpoint: "https://api.worldbank.org/v2/country/{{CODIGO_PAIS}}/indicator/{{CODIGO_INDICADOR}}?format=json",
    useCase: "Comparar una hipótesis de mercado o una métrica de contexto entre países.",
    guardrail: "Documenta indicador, ventana temporal y definición. No conviertas correlación agregada en causalidad comercial.",
    code: `import requests

country = "{{CODIGO_PAIS}}"        # Ej.: MEX
indicator = "{{CODIGO_INDICADOR}}" # Ej.: SP.POP.TOTL
url = f"https://api.worldbank.org/v2/country/{country}/indicator/{indicator}?format=json&per_page=100"

response = requests.get(url, timeout=20)
response.raise_for_status()
metadata, records = response.json()
records[:3]`,
  },
  {
    id: "census-api",
    kind: "API",
    domain: "Demografía & negocio",
    name: "U.S. Census APIs",
    description: "Catálogo de conjuntos demográficos, económicos, laborales y geográficos de Estados Unidos expuestos mediante APIs.",
    access: "Consulta la documentación del conjunto específico; algunas rutas requieren una clave opcional o recomendada.",
    docsUrl: "https://www.census.gov/data/developers/data-sets.html",
    endpoint: "https://api.census.gov/data/{{ANIO}}/{{DATASET}}?get={{VARIABLES}}&for={{GEOGRAFIA}}",
    useCase: "Investigar segmentos, geografía o señales sectoriales para una hipótesis de negocio en EE. UU.",
    guardrail: "Respeta la documentación de cada dataset y trata los resultados como estadísticas agregadas, no como perfiles individuales.",
    code: `import os, requests

url = "https://api.census.gov/data/{{ANIO}}/{{DATASET}}"
params = {"get": "{{VARIABLES}}", "for": "{{GEOGRAFIA}}"}
# Si el conjunto pide clave, guárdala fuera del notebook y añade: params["key"] = os.environ["CENSUS_API_KEY"]
response = requests.get(url, params=params, timeout=20)
response.raise_for_status()
rows = response.json()
rows[:3]`,
  },
  {
    id: "open-meteo",
    kind: "API",
    domain: "Clima & operaciones",
    name: "Open-Meteo Weather Forecast API",
    description: "Series de pronóstico meteorológico que pueden servir para laboratorios de series de tiempo y decisiones operativas dependientes del clima.",
    access: "Consulta pública documentada para el endpoint de pronóstico.",
    docsUrl: "https://open-meteo.com/en/docs",
    endpoint: "https://api.open-meteo.com/v1/forecast?latitude={{LAT}}&longitude={{LON}}&hourly=temperature_2m,precipitation",
    useCase: "Construir un pipeline pequeño de datos externos, variables horarias y validación temporal.",
    guardrail: "Registra hora de extracción y modelo/fuente. Un pronóstico no equivale a una garantía operativa.",
    code: `import requests

params = {
  "latitude": {{LATITUD}},
  "longitude": {{LONGITUD}},
  "hourly": "temperature_2m,precipitation",
  "timezone": "auto",
}
response = requests.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=20)
response.raise_for_status()
weather = response.json()
weather["hourly"]`,
  },
  {
    id: "data-gov-ckan",
    kind: "API",
    domain: "Catálogo de datos públicos",
    name: "Data.gov CKAN API",
    description: "Metadatos para descubrir conjuntos de datos y recursos de agencias gubernamentales de Estados Unidos.",
    access: "Acceso público al catálogo CKAN; devuelve metadatos y enlaces, no necesariamente los datos de origen.",
    docsUrl: "https://data.gov/developers/apis/",
    endpoint: "https://catalog.data.gov/api/3/action/package_search?q={{TERMINO}}",
    useCase: "Encontrar una fuente oficial para un laboratorio, manteniendo el enlace, licencia y responsable del dataset.",
    guardrail: "Revisa el recurso de origen y su licencia antes de descargar, almacenar o redistribuir datos.",
    code: `import requests

params = {"q": "{{TERMINO_DE_BUSQUEDA}}", "rows": 5}
response = requests.get("https://catalog.data.gov/api/3/action/package_search", params=params, timeout=20)
response.raise_for_status()
packages = response.json()["result"]["results"]
[{"title": item["title"], "url": item["url"]} for item in packages]`,
  },
  {
    id: "duckdb",
    kind: "Base de datos",
    domain: "Analítica local",
    name: "DuckDB",
    description: "Motor analítico embebido para explorar CSV, JSON y Parquet directamente en un notebook sin desplegar un servidor.",
    access: "Instalación local en tu entorno de Colab; no requiere credenciales para trabajar con archivos propios.",
    docsUrl: "https://duckdb.org/docs/",
    useCase: "Prototipar consultas y modelos analíticos sobre datasets importados antes de pasar a un almacén gestionado.",
    guardrail: "Mantén rutas y versiones explícitas. Un notebook local no sustituye controles de acceso ni gobernanza de producción.",
    code: `!pip -q install duckdb
import duckdb

query = """
SELECT {{DIMENSION}}, COUNT(*) AS registros
FROM read_parquet('{{RUTA_PARQUET}}')
GROUP BY 1
ORDER BY registros DESC
"""
duckdb.sql(query).df().head(20)`,
  },
  {
    id: "postgresql",
    kind: "Base de datos",
    domain: "Operacional & relacional",
    name: "PostgreSQL",
    description: "Base de datos relacional para aplicaciones y sistemas donde las transacciones, relaciones y permisos deben persistir fuera del notebook.",
    access: "Requiere una instancia administrada y credenciales gestionadas fuera del código.",
    docsUrl: "https://www.postgresql.org/docs/",
    useCase: "Modelar tablas operacionales o servir resultados de un pipeline que ya superó la etapa de laboratorio.",
    guardrail: "Nunca coloques URIs, contraseñas o datos de producción en el notebook. Usa secretos y aplica privilegio mínimo.",
    code: `# Instala solo si el entorno lo necesita.
!pip -q install psycopg[binary]

import os
import psycopg

with psycopg.connect(os.environ["{{NOMBRE_SECRETO_DATABASE_URL}}"], connect_timeout=10) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT {{CAMPOS}} FROM {{TABLA}} LIMIT 20")
        rows = cur.fetchall()
rows`,
  },
  {
    id: "bigquery-public",
    kind: "Base de datos",
    domain: "Analítica a escala",
    name: "BigQuery y datasets públicos",
    description: "Almacén analítico gestionado y catálogo de conjuntos de datos públicos para practicar SQL, costos, particiones y consultas reproducibles.",
    access: "Requiere proyecto de Google Cloud y autenticación para ejecutar consultas; revisa costos, permisos y ubicación de datos.",
    docsUrl: "https://cloud.google.com/bigquery/public-data",
    useCase: "Ejercitar SQL analítico sobre tablas grandes con límites de costo y una hipótesis bien delimitada.",
    guardrail: "Estima bytes procesados, limita tablas/particiones y configura presupuestos. No ejecutes consultas exploratorias sin límite.",
    code: `from google.colab import auth
auth.authenticate_user()

project_id = "{{TU_PROYECTO_GCP}}"
query = """
SELECT {{DIMENSION}}, COUNT(*) AS registros
FROM \`{{PROYECTO.DATASET.TABLA}}\`
WHERE {{FILTRO_PARTICIONADO}}
GROUP BY 1
LIMIT 100
"""
# Ejecuta solo después de estimar el costo de la consulta en BigQuery Console.
query`,
  },
];
