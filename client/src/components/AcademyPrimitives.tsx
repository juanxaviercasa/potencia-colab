import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Clipboard, ExternalLink, FileDown, Play, TerminalSquare } from "lucide-react";
import { useState } from "react";
import type { Lesson, Track } from "@/lib/academy";
import { buildNotebook } from "@/lib/academy";
import { toast } from "sonner";

export const colorClasses: Record<Track["color"], { line: string; soft: string; text: string; glow: string }> = {
  cyan: { line: "bg-cyan-400", soft: "bg-cyan-400/10", text: "text-cyan-200", glow: "shadow-cyan-500/10" },
  violet: { line: "bg-violet-400", soft: "bg-violet-400/10", text: "text-violet-200", glow: "shadow-violet-500/10" },
  amber: { line: "bg-amber-300", soft: "bg-amber-300/10", text: "text-amber-100", glow: "shadow-amber-500/10" },
  emerald: { line: "bg-emerald-400", soft: "bg-emerald-400/10", text: "text-emerald-200", glow: "shadow-emerald-500/10" },
  rose: { line: "bg-rose-400", soft: "bg-rose-400/10", text: "text-rose-200", glow: "shadow-rose-500/10" },
  blue: { line: "bg-blue-400", soft: "bg-blue-400/10", text: "text-blue-200", glow: "shadow-blue-500/10" },
};

export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copiado al portapapeles");
    window.setTimeout(() => setCopied(false), 1400);
  }
  return <Button variant="ghost" size="sm" onClick={copy} className="text-xs text-muted-foreground hover:text-foreground"><>{copied ? <Check className="mr-1.5 size-3.5 text-emerald-300" /> : <Clipboard className="mr-1.5 size-3.5" />}{copied ? "Copiado" : label}</></Button>;
}

export function CodePanel({ code, title = "Celda de Colab" }: { code: string; title?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#081018] shadow-lg shadow-black/15">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300"><TerminalSquare className="size-3.5 text-cyan-300" />{title}</div>
        <CopyButton value={code} label="Copiar código" />
      </div>
      <pre className="max-h-[330px] overflow-auto p-4 text-xs leading-6 text-cyan-50"><code>{code}</code></pre>
    </div>
  );
}

export function LessonActionCard({ lesson, color, completed, onToggle }: { lesson: Lesson; color: Track["color"]; completed: boolean; onToggle: (value: boolean) => void }) {
  const tone = colorClasses[color];
  function openColab() { window.open("https://colab.research.google.com/#create=true", "_blank", "noopener,noreferrer"); }
  function downloadNotebook() {
    const blob = new Blob([buildNotebook(lesson)], { type: "application/x-ipynb+json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${lesson.id}.ipynb`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Notebook .ipynb preparado para importar en Colab");
  }
  return (
    <article className={cn("group rounded-2xl border border-white/10 bg-card/75 p-5 shadow-xl", tone.glow)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div><div className="mb-2 flex flex-wrap gap-2"><Badge className={cn("border-0", tone.soft, tone.text)}>{lesson.level}</Badge><span className="pt-0.5 text-xs text-muted-foreground">{lesson.duration}</span></div><h3 className="text-base font-semibold leading-snug text-foreground">{lesson.title}</h3></div>
        <button onClick={() => onToggle(!completed)} className={cn("grid size-7 shrink-0 place-items-center rounded-full border transition", completed ? "border-emerald-300 bg-emerald-400 text-slate-950" : "border-white/20 bg-white/5 text-transparent hover:border-cyan-300")} aria-label={completed ? "Marcar pendiente" : "Marcar completada"}><Check className="size-4" /></button>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{lesson.outcome}</p>
      <div className="my-4 rounded-xl border border-white/5 bg-background/60 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Misión</p><p className="mt-1 text-sm text-slate-200">{lesson.action}</p></div>
      <div className="mb-5 space-y-2">{lesson.checklist.map((item) => <div key={item} className="flex gap-2 text-xs text-slate-400"><span className={cn("mt-1 size-1.5 shrink-0 rounded-full", tone.line)} />{item}</div>)}</div>
      <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4"><Button size="sm" onClick={openColab} className="bg-foreground text-background hover:bg-foreground/90"><Play className="mr-1.5 size-3.5" />Abrir Colab</Button><Button size="sm" variant="outline" onClick={downloadNotebook} className="border-white/15 bg-white/[0.03] hover:bg-white/10"><FileDown className="mr-1.5 size-3.5" />.ipynb</Button><CopyButton value={lesson.snippet} label="Copiar" /></div>
    </article>
  );
}

export function ExternalResource({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-cyan-300 transition hover:text-cyan-100">{children}<ExternalLink className="size-3.5" /></a>;
}
