import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  lessonProgress,
  mentorMessages,
  personalNotes,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getLessonProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
}

export async function setLessonCompletion(userId: number, lessonId: string, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible");
  const completedAt = completed ? new Date() : null;
  await db
    .insert(lessonProgress)
    .values({ userId, lessonId, completed, completedAt })
    .onDuplicateKeyUpdate({ set: { completed, completedAt } });
}

export async function listNotes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(personalNotes)
    .where(eq(personalNotes.userId, userId))
    .orderBy(desc(personalNotes.updatedAt));
}

type NoteInput = {
  id?: number;
  scopeType: "lesson" | "resource" | "general";
  scopeId: string;
  title: string;
  content: string;
};

export async function saveNote(userId: number, input: NoteInput) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible");
  if (input.id) {
    await db
      .update(personalNotes)
      .set({
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        title: input.title,
        content: input.content,
      })
      .where(and(eq(personalNotes.id, input.id), eq(personalNotes.userId, userId)));
    return input.id;
  }
  const result = await db.insert(personalNotes).values({ userId, ...input });
  return Number(result[0].insertId);
}

export async function deleteNote(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible");
  await db.delete(personalNotes).where(and(eq(personalNotes.id, id), eq(personalNotes.userId, userId)));
}

export async function listMentorMessages(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(mentorMessages)
    .where(eq(mentorMessages.userId, userId))
    .orderBy(desc(mentorMessages.createdAt))
    .limit(limit);
  return rows.reverse();
}

export async function addMentorMessage(
  userId: number,
  role: "user" | "assistant",
  content: string,
) {
  const db = await getDb();
  if (!db) throw new Error("La base de datos no está disponible");
  await db.insert(mentorMessages).values({ userId, role, content });
}
