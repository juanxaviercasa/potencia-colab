import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addMentorMessage,
  deleteNote,
  getLessonProgress,
  listMentorMessages,
  listNotes,
  saveNote,
  setLessonCompletion,
} from "./db";
import { calculateLearningMetrics } from "./progress";
import { isPersonalOwner } from "./security";

const TOTAL_LESSONS = 24;

/** Evita que la información, notas y conversación personal sean visibles para cualquier otra cuenta. */
const personalProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isPersonalOwner(ctx.user.openId, ENV.ownerOpenId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Este centro de operaciones es privado para su propietario.",
    });
  }
  return next();
});

function mentorSystemPrompt(progress: { completed: number; percentage: number; streak: number }, notes: Awaited<ReturnType<typeof listNotes>>) {
  const contextNotes = notes
    .slice(0, 6)
    .map((note) => `- ${note.title}: ${note.content.slice(0, 500)}`)
    .join("\n");
  return `Eres Mentor Colab, un asesor privado, práctico y exigente dentro de un centro personal de aprendizaje. Ayudas a dominar Google Colab, automatización, IA aplicada, creación de contenido, investigación de mercado permitida y diseño de ofertas para negocios. Responde en español latinoamericano.

Estado del alumno: ${progress.completed}/${TOTAL_LESSONS} lecciones completadas (${progress.percentage}%), racha de ${progress.streak} día(s).
Notas personales disponibles:
${contextNotes || "Aún no hay notas guardadas."}

Reglas de respuesta:
1. Da una ruta accionable y pequeña antes de explicar teoría. Incluye celdas de Colab cuando aporten valor y usa placeholders como {{REEMPLAZA_ESTO}}.
2. Distingue entre prototipo en Colab y producción. Explica que los runtimes son efímeros, no prometas GPU, no propongas hosting, workers persistentes, evasión de límites ni automatización abusiva.
3. Para recopilación de datos, exige términos de servicio, robots.txt, límites de tasa, fuentes públicas y no datos personales, cuentas restringidas ni elusión de controles.
4. No atribuyas tácticas a personas concretas como si fueran secretas. Traduce principios verificables: propuesta de valor, experimentos, distribución, costos y medición.
5. Si se solicita una recomendación de negocio, expón supuestos, prueba de demanda, riesgos y métrica de decisión; no prometas ingresos.
6. Usa Markdown: encabezados breves, pasos numerados, una sección "Siguiente movimiento" y, cuando corresponda, "Guardrails".`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  progress: router({
    summary: personalProcedure.query(async ({ ctx }) => {
      const records = await getLessonProgress(ctx.user.id);
      const metrics = calculateLearningMetrics(records, TOTAL_LESSONS);
      return {
        ...metrics,
        completedLessonIds: records.filter((record) => record.completed).map((record) => record.lessonId),
      };
    }),
    toggle: personalProcedure
      .input(z.object({ lessonId: z.string().min(2).max(96), completed: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await setLessonCompletion(ctx.user.id, input.lessonId, input.completed);
        return { success: true };
      }),
  }),
  notes: router({
    list: personalProcedure.query(({ ctx }) => listNotes(ctx.user.id)),
    save: personalProcedure
      .input(z.object({
        id: z.number().int().positive().optional(),
        scopeType: z.enum(["lesson", "resource", "general"]),
        scopeId: z.string().min(1).max(96),
        title: z.string().trim().min(2).max(180),
        content: z.string().trim().min(1).max(30000),
      }))
      .mutation(({ ctx, input }) => saveNote(ctx.user.id, input)),
    delete: personalProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await deleteNote(ctx.user.id, input.id);
        return { success: true };
      }),
  }),
  mentor: router({
    nextStep: personalProcedure.mutation(async ({ ctx }) => {
      const [records, notes] = await Promise.all([
        getLessonProgress(ctx.user.id),
        listNotes(ctx.user.id),
      ]);
      const metrics = calculateLearningMetrics(records, TOTAL_LESSONS);
      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          maxTokens: 700,
          messages: [
            { role: "system", content: mentorSystemPrompt(metrics, notes) },
            {
              role: "user",
              content: "Propón el siguiente movimiento de aprendizaje más valioso para esta semana. Responde con: 1) una misión concreta de 45-90 minutos, 2) el artefacto de evidencia, 3) criterio de terminado, y 4) por qué es el cuello de botella actual. No inventes progreso ni recursos no proporcionados.",
            },
          ],
        });
        const content = response.choices[0]?.message?.content;
        return {
          content: typeof content === "string" && content.trim()
            ? content
            : "Completa la siguiente misión pendiente de tu mapa y documenta un hallazgo verificable en la Bóveda de notas.",
        };
      } catch (error) {
        console.error("[Mentor] next step error", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No fue posible generar el próximo paso ahora. Puedes continuar con la siguiente misión pendiente.",
        });
      }
    }),
    history: personalProcedure.query(({ ctx }) => listMentorMessages(ctx.user.id)),
    ask: personalProcedure
      .input(z.object({ content: z.string().trim().min(2).max(5000) }))
      .mutation(async ({ ctx, input }) => {
        const [history, records, notes] = await Promise.all([
          listMentorMessages(ctx.user.id, 14),
          getLessonProgress(ctx.user.id),
          listNotes(ctx.user.id),
        ]);
        const metrics = calculateLearningMetrics(records, TOTAL_LESSONS);
        await addMentorMessage(ctx.user.id, "user", input.content);
        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            maxTokens: 1400,
            messages: [
              { role: "system", content: mentorSystemPrompt(metrics, notes) },
              ...history.map((message) => ({ role: message.role, content: message.content })),
              { role: "user", content: input.content },
            ],
          });
          const content = response.choices[0]?.message?.content;
          const answer = typeof content === "string" && content.trim()
            ? content
            : "No pude generar una respuesta útil en este momento. Intenta reformular la misión con un resultado concreto.";
          await addMentorMessage(ctx.user.id, "assistant", answer);
          return { content: answer };
        } catch (error) {
          console.error("[Mentor] Error", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "El mentor no está disponible temporalmente. Tus notas y progreso siguen guardados.",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
