# Guía de código listo para copiar

Esta guía acompaña a **Colab Atelier**. Los bloques están diseñados para copiarse a un notebook nuevo y sustituir solamente los campos con el formato `{{NOMBRE_DEL_CAMPO}}`. La aplicación también contiene estas plantillas en la sección **Biblioteca**, desde donde pueden copiarse o exportarse como archivos `.ipynb`.

> **Uso recomendado:** Google Colab sirve como laboratorio de código y prototipado. Sus runtimes son temporales, sus recursos no son garantizados y no debe utilizarse como servicio de hosting ni como un proceso persistente. Guarda notebooks, artefactos y datos importantes fuera de la VM. [1]

| Placeholder | Qué debes sustituir | Ejemplo seguro |
|---|---|---|
| `{{NOMBRE_PROYECTO}}` | Nombre corto sin espacios del experimento | `auditoria_restaurantes` |
| `{{RUTA_CSV}}` | Ruta a un archivo autorizado | `/content/data/ventas.csv` |
| `{{ID}}` | Columna identificadora única | `order_id` |
| `{{METRICA}}` | Columna numérica que validarás | `revenue` |
| `{{URL_PUBLICA_PERMITIDA}}` | Página pública cuya extracción está permitida | `https://example.org/catalogo` |
| `{{NOMBRE_SECRETO}}` | Nombre de una variable de entorno, nunca el valor | `MI_API_KEY` |
| `{{PREGUNTA_DE_DECISION}}` | Decisión que el análisis debe ayudar a tomar | `¿Qué categoría priorizar?` |

## 1. Bootstrap reproducible de Colab

```python
# Celda 0 — Bootstrap reproducible
!pip -q install -U pandas pyarrow duckdb

import sys
import platform
from pathlib import Path

PROJECT = Path("/content/{{NOMBRE_PROYECTO}}")
DATA = PROJECT / "data"
OUTPUT = PROJECT / "output"

for folder in (DATA, OUTPUT):
    folder.mkdir(parents=True, exist_ok=True)

print({
    "python": sys.version.split()[0],
    "platform": platform.platform(),
    "project": str(PROJECT),
})
```

Antes de continuar, anota la versión de Python, las dependencias y la fuente de datos. Las celdas de instalación deben permanecer en el notebook porque el entorno no se comparte ni persiste al reiniciar. [1]

## 2. Quality Gate para un CSV autorizado

```python
import pandas as pd

df = pd.read_csv("{{RUTA_CSV}}")

quality_report = {
    "rows": len(df),
    "columns": list(df.columns),
    "duplicate_rows": int(df.duplicated().sum()),
    "top_null_rates": df.isna().mean().sort_values(ascending=False).head(10),
}

print(quality_report)

# Reemplaza las columnas antes de ejecutar estas reglas.
assert df["{{ID}}"].notna().all(), "Hay claves vacías"
assert df["{{ID}}"].is_unique, "Hay claves duplicadas"
assert df["{{METRICA}}"].ge(0).all(), "Hay valores negativos"
```

## 3. Consulta local con DuckDB

```python
import duckdb

query = """
SELECT
  {{DIMENSION}},
  COUNT(*) AS eventos,
  SUM({{METRICA}}) AS valor_total
FROM read_parquet('{{RUTA_PARQUET}}')
WHERE {{FILTRO_VALIDO}}
GROUP BY 1
ORDER BY valor_total DESC
"""

result = duckdb.sql(query).df()
display(result.head(20))
```

## 4. Cliente de API documentada

```python
import os
import requests

url = "{{ENDPOINT_DOCUMENTADO}}"
api_key = os.environ.get("{{NOMBRE_SECRETO}}")

if not api_key:
    raise RuntimeError("Falta configurar {{NOMBRE_SECRETO}} como variable de entorno")

response = requests.get(
    url,
    headers={"Authorization": f"Bearer {api_key}"},
    timeout=20,
)
response.raise_for_status()
payload = response.json()
```

No pegues claves, tokens ni información de clientes en celdas o notebooks compartidos. Documenta el proveedor, el permiso, el límite de tasa y la finalidad de uso.

## 5. Extracción mínima y ética de una página pública

```python
import requests
from bs4 import BeautifulSoup

url = "{{URL_PUBLICA_PERMITIDA}}"

response = requests.get(
    url,
    headers={"User-Agent": "{{NOMBRE_DE_TU_PROYECTO_Y_CONTACTO}}"},
    timeout=20,
)
response.raise_for_status()

soup = BeautifulSoup(response.text, "html.parser")
print(soup.title.get_text(strip=True))
```

Este bloque **no** es una autorización para extraer cualquier sitio. Antes de usarlo, verifica términos de uso y `robots.txt`, usa baja frecuencia, limita la prueba a páginas públicas, evita inicios de sesión, CAPTCHAs, datos personales y cualquier intento de eludir controles.

## 6. Brief de contenido basado en evidencia

```python
content_brief = {
    "audience": "{{AUDIENCIA}}",
    "decision_question": "{{PREGUNTA_DE_DECISION}}",
    "validated_signal": "{{HALLAZGO_CON_FUENTE}}",
    "content_angle": "{{ANGULO_UTIL}}",
    "channel": "{{CANAL}}",
    "human_review_required": True,
}

content_brief
```

La regla es simple: una fuente verificable, una observación útil y una revisión humana antes de publicar. No conviertas señales débiles en afirmaciones, cifras o testimonios.

## 7. Diseño de un piloto de datos

```python
pilot_offer = {
    "segment": "{{TIPO_DE_CLIENTE}}",
    "problem": "{{FRICCION_MEDIBLE}}",
    "deliverable": "{{ARTEFACTO_DE_DATOS}}",
    "scope": "{{INCLUYE_Y_EXCLUYE}}",
    "success_metric": "{{METRICA_ACORDADA}}",
    "decision_gate": "{{CUANDO_ESCALAR_O_DETENER}}",
    "human_owner": "{{RESPONSABLE}}",
}

pilot_offer
```

Un piloto responsable define lo que se entregará y cómo se evaluará; no promete resultados comerciales que dependan de factores fuera de tu control.

## Dónde encontrar el código de la web

| Área | Archivo principal | Qué personalizar |
|---|---|---|
| Rutas, lecciones y plantillas | `client/src/lib/academy.ts` | Contenido de las seis rutas, snippets y recursos externos. |
| Interfaz y páginas | `client/src/pages/AcademyPages.tsx` | Copy, estructura de laboratorios, playbooks y experiencia de notas. |
| Navegación y acceso personal | `client/src/components/DashboardLayout.tsx` | Nombre, etiquetas y navegación lateral. |
| Mentoría y privacidad | `server/routers.ts` | Prompt del mentor, límites de contexto y reglas de uso. |
| Notas, progreso y memoria | `server/db.ts` y `drizzle/schema.ts` | Estructura de datos y consultas personales. |
| Importación de datasets | `client/src/pages/DataOperationsPages.tsx` y `server/importRoutes.ts` | Límite de 10 MB, tipos permitidos, previsualización y persistencia privada. |
| Proyectos de portafolio | `client/src/pages/DataOperationsPages.tsx` | Plantillas, rúbrica, progreso y evidencia técnica. |
| Catálogo de fuentes | `client/src/lib/dataCatalog.ts` y `client/src/pages/CatalogPage.tsx` | Fuentes autorizadas, guardrails, enlaces oficiales y snippets. |

## 8. Importar un dataset de forma responsable

La sección **Importaciones** acepta CSV, JSON y Parquet de hasta **10 MB**. Para CSV y JSON muestra una vista previa local antes de transferir el archivo; Parquet se conserva para explorarlo en DuckDB o Colab. El nombre, tipo, tamaño y referencia de almacenamiento quedan en tu registro privado.

Antes de importar, confirma que puedes usar los datos y que no incluyen secretos, información financiera, información confidencial o datos personales que no sean necesarios para el laboratorio.

## 9. Convertir un laboratorio en proyecto de portafolio

En **Portafolio**, cada proyecto debe cubrir los cuatro componentes de la rúbrica:

| Componente | Pregunta que debes responder |
|---|---|
| Problema definido | ¿Qué decisión o fricción investigas y para quién? |
| Entregable reproducible | ¿Qué notebook, consulta, pipeline o reporte puede reejecutarse? |
| Evidencia auditable | ¿Qué salida, captura, regla o definición respalda el resultado? |
| Avance documentado | ¿Qué parte está construida y cuál es el siguiente bloqueo? |

No adjuntes datos privados al portafolio público. Describe el método y sustituye el material sensible por muestras anonimizadas.

## 10. Usar el catálogo de datos y APIs

El catálogo enlaza documentación oficial y ofrece plantillas con placeholders. Por ejemplo, para una consulta de indicadores del Banco Mundial:

```python
import requests

country = "{{CODIGO_PAIS}}"        # Ej.: MEX
indicator = "{{CODIGO_INDICADOR}}" # Ej.: SP.POP.TOTL
url = f"https://api.worldbank.org/v2/country/{country}/indicator/{indicator}?format=json&per_page=100"

response = requests.get(url, timeout=20)
response.raise_for_status()
metadata, records = response.json()
```

La API de indicadores del Banco Mundial documenta acceso programático a sus series y no requiere claves para el endpoint indicado. [2] Para cada fuente, conserva la URL, la licencia o términos, el límite de tasa, la fecha de extracción y la decisión que quieres informar.

## Referencias

[1] [Google Colab — Preguntas frecuentes](https://research.google.com/colaboratory/faq.html)
[2] [World Bank — Indicators API Documentation](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation)
