import { describe, expect, it } from "vitest";
import { dataCatalog } from "./dataCatalog";

describe("dataCatalog", () => {
  it("incluye APIs y bases de datos con documentación oficial, guardrails y código adaptable", () => {
    expect(dataCatalog.some((item) => item.kind === "API")).toBe(true);
    expect(dataCatalog.some((item) => item.kind === "Base de datos")).toBe(true);
    dataCatalog.forEach((item) => {
      expect(item.docsUrl).toMatch(/^https:\/\//);
      expect(item.guardrail.length).toBeGreaterThan(20);
      expect(item.code).toContain("{{");
    });
  });
});
