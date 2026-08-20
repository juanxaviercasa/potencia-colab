import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getLessonProgress: vi.fn(),
  setLessonCompletion: vi.fn(),
  listNotes: vi.fn(),
  saveNote: vi.fn(),
  deleteNote: vi.fn(),
  listMentorMessages: vi.fn(),
  addMentorMessage: vi.fn(),
  invokeLLM: vi.fn(),
}));

vi.mock("./db", () => ({
  getLessonProgress: mocks.getLessonProgress,
  setLessonCompletion: mocks.setLessonCompletion,
  listNotes: mocks.listNotes,
  saveNote: mocks.saveNote,
  deleteNote: mocks.deleteNote,
  listMentorMessages: mocks.listMentorMessages,
  addMentorMessage: mocks.addMentorMessage,
}));

vi.mock("./_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));

import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function contextFor(openId = ENV.ownerOpenId): TrpcContext {
  return {
    user: {
      id: 9,
      openId: openId ?? "missing-owner",
      name: "Propietario de prueba",
      email: "owner@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("rutas personales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLessonProgress.mockResolvedValue([]);
    mocks.listNotes.mockResolvedValue([]);
    mocks.listMentorMessages.mockResolvedValue([]);
    mocks.setLessonCompletion.mockResolvedValue(undefined);
    mocks.saveNote.mockResolvedValue(77);
    mocks.deleteNote.mockResolvedValue(undefined);
    mocks.addMentorMessage.mockResolvedValue(undefined);
    mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "Misión de prueba" } }] });
  });

  it("permite al propietario consultar progreso y guardar una nota", async () => {
    const caller = appRouter.createCaller(contextFor());

    const summary = await caller.progress.summary();
    const noteId = await caller.notes.save({
      scopeType: "resource",
      scopeId: "colab-faq",
      title: "Aprendizaje de prueba",
      content: "# Hallazgo\nUna nota vinculada.",
    });

    expect(summary).toMatchObject({ completed: 0, totalLessons: 24, percentage: 0, streak: 0 });
    expect(noteId).toBe(77);
    expect(mocks.saveNote).toHaveBeenCalledWith(9, expect.objectContaining({ scopeId: "colab-faq" }));
  });

  it("conserva contexto y memoria cuando el propietario consulta al mentor", async () => {
    mocks.getLessonProgress.mockResolvedValue([{ completed: true, completedAt: new Date() }]);
    mocks.listNotes.mockResolvedValue([{ title: "Insight", content: "Aprender calidad de datos." }]);
    const caller = appRouter.createCaller(contextFor());

    const result = await caller.mentor.ask({ content: "Diseña mi siguiente laboratorio." });

    expect(result).toEqual({ content: "Misión de prueba" });
    expect(mocks.addMentorMessage).toHaveBeenCalledTimes(2);
    expect(mocks.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-5-mini" }));
  });

  it("bloquea todas las rutas personales para una cuenta diferente", async () => {
    const caller = appRouter.createCaller(contextFor("another-account"));

    await expect(caller.progress.summary()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.notes.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.mentor.history()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rechaza entradas inválidas antes de invocar almacenamiento o IA", async () => {
    const caller = appRouter.createCaller(contextFor());

    await expect(caller.notes.save({ scopeType: "general", scopeId: "inbox", title: "", content: "x" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.mentor.ask({ content: " " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.saveNote).not.toHaveBeenCalled();
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });
});
