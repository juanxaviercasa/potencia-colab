import { describe, expect, it } from "vitest";
import { calculateLearningMetrics } from "./progress";

describe("calculateLearningMetrics", () => {
  it("calcula progreso y una racha consecutiva hasta hoy", () => {
    const now = new Date("2026-08-20T12:00:00.000Z");
    const result = calculateLearningMetrics(
      [
        { completed: true, completedAt: new Date("2026-08-20T08:00:00.000Z") },
        { completed: true, completedAt: new Date("2026-08-19T08:00:00.000Z") },
        { completed: true, completedAt: new Date("2026-08-18T08:00:00.000Z") },
        { completed: false, completedAt: null },
      ],
      24,
      now,
    );

    expect(result).toEqual({ completed: 3, totalLessons: 24, percentage: 13, streak: 3 });
  });

  it("mantiene la racha que termina ayer si todavía no hay actividad hoy", () => {
    const now = new Date("2026-08-20T12:00:00.000Z");
    const result = calculateLearningMetrics(
      [{ completed: true, completedAt: new Date("2026-08-19T08:00:00.000Z") }],
      24,
      now,
    );

    expect(result.streak).toBe(1);
  });
});
