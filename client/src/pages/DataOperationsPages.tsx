import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Database, FileJson, FileSpreadsheet, FolderKanban, HardDriveUpload, Loader2, Plus, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type DetectedType = "csv" | "json" | "parquet";

type Preview = { headers: string[]; rows: string[][]; message?: string };

const MAX_BYTES = 10 * 1024 * 1024;

function detectType(file: File): DetectedType | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "csv" || extension === "json" || extension === "parquet" ? extension : null;
}

function parseCsv(text: string): Preview {
  const lines = text.split(/\r?\n/).filter(Boolean).slice(0, 21);
  if (!lines.length) return { headers: [], rows: [], message: "El archivo no contiene filas legibles." };
  const split = (line: string) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
  const headers = split(lines[0]);
  return { headers, rows: lines.slice(1).map(split) };
}

async function previewFile(file: File, type: DetectedType): Promise<Preview> {
  if (type === "parquet") return { headers: [], rows: [], message: "Parquet está listo para importarse. Ábrelo en Colab o DuckDB para inspeccionar el esquema." };
  const text = await file.text();
  if (type === "csv") return parseCsv(text);
  try {
    const value = JSON.parse(text) as unknown;
    const rows = Array.isArray(value) ? value : [value];
    const objects = rows.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null).slice(0, 20);
    const headers = Array.from(new Set(objects.flatMap((item) => Object.keys(item)))).slice(0, 12);
    return { headers, rows: objects.map((item) => headers.map((header) => String(item[header] ?? ""))) };
  } catch {
    return { headers: [], rows: [], message: "El JSON no es válido. Corrígelo antes de importar." };
  }
}

function formatBytes(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function ImportsPage() {
  const utils = trpc.useUtils();
  const imports = trpc.imports.list.useQuery();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<DetectedType | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [uploading, setUploading] = useState(false);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(null); setType(null); setPreview(null);
    if (!selected) return;
    const detected = detectType(selected);
    if (!detected) return toast.error("Solo se permiten archivos CSV, JSON o Parquet.");
    if (selected.size > MAX_BYTES) return toast.error("El límite de importación es 10 MB por archivo.");
    setFile(selected); setType(detected);
    try { setPreview(await previewFile(selected, detected)); } catch { setPreview({ headers: [], rows: [], message: "No fue posible previsualizar este archivo." }); }
  }

  async function upload() {
    if (!file || !type) return;
    setUploading(true);
    try {
      const response = await fetch("/api/imports/upload", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-file-name": encodeURIComponent(file.name),
          "x-file-type": type,
          "x-file-mime": file.type || "application/octet-stream",
        },
        body: await file.arrayBuffer(),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "No se pudo importar el archivo.");
      toast.success("Dataset importado de forma privada.");
      setFile(null); setType(null); setPreview(null);
      await utils.imports.list.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error de importación.");
    } finally { setUploading(false); }
  }

  return <div className="academy-page"><header className="mb-8 max-w-4xl"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Data intake</p><h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Importa un dataset. Inspecciónalo antes de convertirlo en evidencia.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">La importación conserva un archivo privado de hasta 10 MB para tus laboratorios. Antes de cargarlo, verifica que tienes permiso de uso y que no contiene información sensible o datos personales innecesarios.</p></header><div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><section className="rounded-3xl border border-white/10 bg-card p-6"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-cyan-300/10"><HardDriveUpload className="size-5 text-cyan-200" /></div><div><h2 className="font-semibold text-foreground">Zona de importación privada</h2><p className="text-sm text-muted-foreground">CSV, JSON o Parquet · máximo 10 MB</p></div></div><label className="mt-6 grid cursor-pointer place-items-center rounded-2xl border border-dashed border-cyan-300/25 bg-cyan-300/[0.035] px-6 py-10 text-center transition hover:bg-cyan-300/[0.07]"><UploadCloud className="size-8 text-cyan-200" /><span className="mt-3 font-medium text-foreground">Selecciona un dataset autorizado</span><span className="mt-1 text-sm text-muted-foreground">Se conserva en almacenamiento privado asociado a tu sesión.</span><input type="file" accept=".csv,.json,.parquet,text/csv,application/json,application/octet-stream" className="sr-only" onChange={selectFile} /></label>{file && <div className="mt-5 rounded-2xl border border-white/10 bg-background/50 p-4"><div className="flex items-center gap-3"><FileSpreadsheet className="size-5 text-violet-200" /><div className="min-w-0 flex-1"><p className="truncate font-medium text-foreground">{file.name}</p><p className="text-xs text-muted-foreground">{type?.toUpperCase()} · {formatBytes(file.size)}</p></div><Button onClick={upload} disabled={uploading}>{uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}{uploading ? "Subiendo" : "Importar"}</Button></div></div>}<div className="mt-6 flex gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-200" /><p className="text-sm leading-6 text-amber-50/75">No subas tokens, contraseñas, datos financieros, listas de clientes ni datos de personas. Para practicar, usa muestras anonimizadas y fuentes con permiso.</p></div></section><section className="rounded-3xl border border-white/10 bg-[#0b141e] p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Previsualización local</p>{!preview && <div className="grid min-h-64 place-items-center text-center"><FileJson className="size-9 text-slate-600" /><p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">Elige un CSV o JSON para inspeccionar una muestra antes de importar.</p></div>}{preview?.message && <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">{preview.message}</div>}{preview && preview.headers.length > 0 && <div className="mt-5 overflow-auto rounded-xl border border-white/10"><table className="min-w-full text-left text-xs"><thead className="bg-white/[0.04] text-slate-300"><tr>{preview.headers.map((header) => <th key={header} className="whitespace-nowrap px-3 py-2 font-medium">{header}</th>)}</tr></thead><tbody>{preview.rows.map((row, index) => <tr key={index} className="border-t border-white/5 text-slate-400">{preview.headers.map((header, cell) => <td key={header} className="max-w-40 truncate px-3 py-2">{row[cell]}</td>)}</tr>)}</tbody></table></div>}</section></div><section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dataset registry</p><h2 className="mt-2 text-xl font-semibold text-foreground">Importaciones disponibles</h2></div><span className="text-sm text-muted-foreground">{imports.data?.length ?? 0} archivos privados</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{imports.data?.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-card p-5"><div className="flex items-center justify-between"><Badge className="border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">{item.fileType.toUpperCase()}</Badge><span className="text-xs text-slate-500">{formatBytes(item.byteSize)}</span></div><h3 className="mt-4 truncate font-medium text-foreground">{item.name}</h3><p className="mt-2 text-xs text-muted-foreground">Importado {new Date(item.createdAt).toLocaleDateString("es-419")}</p><a className="mt-5 inline-flex text-sm text-cyan-300 hover:text-cyan-100" href={item.storageUrl} target="_blank" rel="noreferrer">Abrir archivo</a></article>)}</div>{imports.data?.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-muted-foreground">Aún no hay datasets importados. Inicia con una muestra segura para construir tu primer proyecto.</div>}</section></div>;
}

const categories = [
  { value: "analytics", label: "Analítica", accent: "text-cyan-200" },
  { value: "quality", label: "Calidad", accent: "text-emerald-200" },
  { value: "pipeline", label: "Pipeline", accent: "text-amber-200" },
  { value: "ai_product", label: "Producto IA", accent: "text-violet-200" },
] as const;

const projectTemplates = [
  { title: "Auditoría de calidad de datos", category: "quality", brief: "Investigar la confiabilidad de un dataset autorizado y localizar valores nulos, duplicados o reglas rotas que afecten una decisión.", deliverable: "Notebook reproducible, reporte de calidad y tres recomendaciones priorizadas.", evidence: "Captura del reporte, reglas ejecutadas, enlace al notebook y una decisión propuesta." },
  { title: "Tablero de señal de demanda", category: "analytics", brief: "Transformar un conjunto de eventos autorizado en una métrica semanal que ayude a priorizar una decisión real.", deliverable: "Dataset limpio, consulta SQL y visualización de una métrica con definición documentada.", evidence: "Diccionario de métricas, captura de resultado y explicación de límites." },
  { title: "Pipeline con control de calidad", category: "pipeline", brief: "Construir un pipeline modular que lea, valide y produzca un artefacto versionado a partir de una fuente permitida.", deliverable: "Notebook modular con input, transformación, quality gates y output Parquet.", evidence: "Diagrama simple, ejecución registrada y resultado de los tests de calidad." },
];

const defaultChecklist = [
  "Verifiqué la procedencia, permiso y límite de uso de la fuente.",
  "Preparé un notebook con bootstrap y dependencias explícitas.",
  "Implementé al menos una validación de calidad o supuesto crítico.",
  "Guardé una evidencia y redacté la siguiente decisión o experimento.",
];

function parseChecklist(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(Boolean).slice(0, defaultChecklist.length) : defaultChecklist.map(() => false);
  } catch {
    return defaultChecklist.map(() => false);
  }
}

function rubricScore(project: { brief: string; deliverable: string; evidence: string; progress: number }) {
  return Math.min(100, (project.brief.length >= 80 ? 25 : 10) + (project.deliverable.length >= 50 ? 25 : 10) + (project.evidence.length >= 50 ? 25 : 10) + Math.round(project.progress * 0.25));
}

export function PortfolioPage() {
  const utils = trpc.useUtils();
  const imports = trpc.imports.list.useQuery();
  const projects = trpc.projects.list.useQuery();
  const save = trpc.projects.save.useMutation({ onSuccess: () => { utils.projects.list.invalidate(); toast.success("Proyecto guardado en el portafolio."); } });
  const remove = trpc.projects.delete.useMutation({ onSuccess: () => utils.projects.list.invalidate() });
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const template = projectTemplates[selectedTemplate];
  const [title, setTitle] = useState(template.title);
  const [category, setCategory] = useState<typeof categories[number]["value"]>(template.category as typeof categories[number]["value"]);
  const [sourceFileId, setSourceFileId] = useState<string>("");
  const [brief, setBrief] = useState(template.brief);
  const [deliverable, setDeliverable] = useState(template.deliverable);
  const [evidence, setEvidence] = useState(template.evidence);
  const [checklist, setChecklist] = useState(defaultChecklist.map(() => false));
  const [progress, setProgress] = useState(0);
  const score = useMemo(() => rubricScore({ brief, deliverable, evidence, progress }), [brief, deliverable, evidence, progress]);
  function applyTemplate(index: number) { const item = projectTemplates[index]; setSelectedTemplate(index); setTitle(item.title); setCategory(item.category as typeof categories[number]["value"]); setBrief(item.brief); setDeliverable(item.deliverable); setEvidence(item.evidence); setChecklist(defaultChecklist.map(() => false)); setProgress(0); }
  function toggleChecklist(index: number) { setChecklist((previous) => previous.map((value, itemIndex) => itemIndex === index ? !value : value)); }
  function createProject() { save.mutate({ title, category, sourceFileId: sourceFileId ? Number(sourceFileId) : null, status: progress === 100 ? "complete" : progress >= 60 ? "review" : progress > 0 ? "building" : "idea", brief, deliverable, evidence, checklist: JSON.stringify(checklist), progress }); }
  return <div className="academy-page"><header className="mb-8 max-w-4xl"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Portfolio studio</p><h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Convierte práctica en prueba pública de criterio técnico.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Cada proyecto exige un problema, un entregable reproducible y evidencia auditable. La rúbrica no premia actividad; puntúa claridad, capacidad de demostrar y avance verificable.</p></header><div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><section className="rounded-3xl border border-white/10 bg-card p-6"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-violet-300/10"><FolderKanban className="size-5 text-violet-200" /></div><div><h2 className="font-semibold text-foreground">Nuevo proyecto de evidencia</h2><p className="text-sm text-muted-foreground">Empieza desde una plantilla o personaliza el brief.</p></div></div><div className="mt-6 flex flex-wrap gap-2">{projectTemplates.map((item, index) => <button key={item.title} onClick={() => applyTemplate(index)} className={cn("rounded-full border px-3 py-1.5 text-sm transition", selectedTemplate === index ? "border-violet-300/35 bg-violet-300/10 text-violet-100" : "border-white/10 text-muted-foreground hover:bg-white/[0.04]")}>{item.title}</button>)}</div><div className="mt-6 grid gap-4"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nombre del proyecto" className="border-white/10 bg-background/50" /><div className="grid gap-4 sm:grid-cols-2"><select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="h-10 rounded-md border border-white/10 bg-background/50 px-3 text-sm text-foreground"><option value="analytics">Analítica</option><option value="quality">Calidad</option><option value="pipeline">Pipeline</option><option value="ai_product">Producto IA</option></select><select value={sourceFileId} onChange={(event) => setSourceFileId(event.target.value)} className="h-10 rounded-md border border-white/10 bg-background/50 px-3 text-sm text-foreground"><option value="">Sin dataset importado</option>{imports.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><Textarea value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Problema y pregunta de decisión" className="min-h-28 border-white/10 bg-background/50" /><Textarea value={deliverable} onChange={(event) => setDeliverable(event.target.value)} placeholder="Entregable reproducible" className="min-h-24 border-white/10 bg-background/50" /><Textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Evidencia verificable" className="min-h-24 border-white/10 bg-background/50" /><div className="rounded-2xl border border-white/10 bg-background/40 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium text-foreground">Checklist de ejecución</p><span className="text-xs text-muted-foreground">{checklist.filter(Boolean).length}/{checklist.length} completados</span></div><div className="space-y-2">{defaultChecklist.map((item, index) => <button type="button" key={item} onClick={() => toggleChecklist(index)} className="flex w-full items-start gap-2 text-left text-sm"><span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded border", checklist[index] ? "border-emerald-300 bg-emerald-300 text-slate-950" : "border-white/20 bg-white/[0.03] text-transparent")}><CheckCircle2 className="size-3" /></span><span className={checklist[index] ? "text-slate-200" : "text-slate-500"}>{item}</span></button>)}</div></div><div><div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">Avance demostrable</span><span className="font-medium text-foreground">{progress}%</span></div><input type="range" min="0" max="100" step="10" value={progress} onChange={(event) => setProgress(Number(event.target.value))} className="w-full accent-cyan-300" /></div><Button disabled={save.isPending} onClick={createProject}><Plus className="mr-2 size-4" />{save.isPending ? "Guardando..." : "Guardar proyecto"}</Button></div></section><aside className="rounded-3xl border border-white/10 bg-[#0b141e] p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Rúbrica de evidencia</p><div className="mt-4 flex items-end gap-3"><p className="text-5xl font-semibold tracking-tight text-foreground">{score}</p><p className="pb-1 text-sm text-muted-foreground">/100</p></div><Progress value={score} className="mt-4 h-2 bg-white/10" /><div className="mt-7 space-y-4">{[["Problema definido", brief.length >= 80], ["Entregable reproducible", deliverable.length >= 50], ["Evidencia auditable", evidence.length >= 50], ["Checklist de ejecución", checklist.some(Boolean)], ["Avance documentado", progress >= 60]].map(([label, pass]) => <div key={String(label)} className="flex items-center gap-3 text-sm"><CheckCircle2 className={cn("size-4", pass ? "text-emerald-300" : "text-slate-600")} /><span className={pass ? "text-slate-200" : "text-slate-500"}>{label}</span></div>)}</div><div className="mt-7 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-4 text-xs leading-5 text-amber-50/70"><AlertTriangle className="mb-2 size-4 text-amber-200" />No incluyas información confidencial o datasets privados en la evidencia de un portafolio público. Describe el método y usa muestras anonimizadas cuando corresponda.</div></aside></div><section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Evidence ledger</p><h2 className="mt-2 text-xl font-semibold text-foreground">Proyectos activos</h2></div><span className="text-sm text-muted-foreground">{projects.data?.length ?? 0} proyectos</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.data?.map((project) => { const label = categories.find((item) => item.value === project.category); const score = rubricScore(project); const completedChecks = parseChecklist(project.checklist).filter(Boolean).length; return <article key={project.id} className="rounded-2xl border border-white/10 bg-card p-5"><div className="flex items-center justify-between"><Badge className="border border-white/10 bg-white/[0.04] text-slate-300">{label?.label}</Badge><span className="text-xs uppercase tracking-[0.12em] text-slate-500">{project.status}</span></div><h3 className="mt-4 font-semibold text-foreground">{project.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{project.brief}</p><div className="mt-5 flex items-center justify-between text-sm"><span className="text-slate-400">Rúbrica</span><span className="font-semibold text-foreground">{score}/100</span></div><Progress value={project.progress} className="mt-2 h-1.5 bg-white/10" /><div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Checklist {completedChecks}/{defaultChecklist.length}</span><span>Avance {project.progress}%</span></div><div className="mt-5 flex items-center justify-between"><span className="text-xs text-muted-foreground">Actualizado {new Date(project.updatedAt).toLocaleDateString("es-419")}</span><Button variant="ghost" size="sm" onClick={() => remove.mutate({ id: project.id })} className="px-0 text-rose-300 hover:bg-transparent hover:text-rose-200"><Trash2 className="mr-1.5 size-3.5" />Eliminar</Button></div></article>; })}</div>{projects.data?.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-muted-foreground">Aún no hay proyectos. Crea uno cuyo resultado puedas explicar, reproducir y defender.</div>}</section></div>;
}
