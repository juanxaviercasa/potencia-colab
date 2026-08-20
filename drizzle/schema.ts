import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

/** Identidad de sesión proporcionada por Manus OAuth. La app se protege además a nivel de router para conservar el uso personal. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const lessonProgress = mysqlTable(
  "lesson_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: varchar("lessonId", { length: 96 }).notNull(),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completedAt"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    unique("lesson_progress_user_lesson_unique").on(table.userId, table.lessonId),
    index("lesson_progress_user_idx").on(table.userId),
  ],
);

export const personalNotes = mysqlTable(
  "personal_notes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    scopeType: mysqlEnum("scopeType", ["lesson", "resource", "general"]).default("general").notNull(),
    scopeId: varchar("scopeId", { length: 96 }).default("inbox").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("personal_notes_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const mentorMessages = mysqlTable(
  "mentor_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["user", "assistant"]).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("mentor_messages_user_created_idx").on(table.userId, table.createdAt)],
);

export const importedFiles = mysqlTable(
  "imported_files",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    fileType: mysqlEnum("fileType", ["csv", "json", "parquet"]).notNull(),
    mimeType: varchar("mimeType", { length: 128 }).notNull(),
    byteSize: int("byteSize").notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    storageUrl: text("storageUrl").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("imported_files_user_created_idx").on(table.userId, table.createdAt)],
);

export const portfolioProjects = mysqlTable(
  "portfolio_projects",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    sourceFileId: int("sourceFileId").references(() => importedFiles.id, { onDelete: "set null" }),
    title: varchar("title", { length: 180 }).notNull(),
    category: mysqlEnum("category", ["analytics", "quality", "pipeline", "ai_product"]).notNull(),
    status: mysqlEnum("status", ["idea", "building", "review", "complete"]).default("idea").notNull(),
    brief: text("brief").notNull(),
    deliverable: text("deliverable").notNull(),
    evidence: text("evidence").notNull(),
    checklist: varchar("checklist", { length: 8000 }).notNull().default("[]"),
    progress: int("progress").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("portfolio_projects_user_updated_idx").on(table.userId, table.updatedAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type PersonalNote = typeof personalNotes.$inferSelect;
export type MentorMessage = typeof mentorMessages.$inferSelect;
export type ImportedFile = typeof importedFiles.$inferSelect;
export type PortfolioProject = typeof portfolioProjects.$inferSelect;
