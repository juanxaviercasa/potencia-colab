import { describe, expect, it } from "vitest";
import { isPersonalOwner } from "./security";

describe("isPersonalOwner", () => {
  it("permite solo a la identidad exacta del propietario", () => {
    expect(isPersonalOwner("owner-123", "owner-123")).toBe(true);
    expect(isPersonalOwner("other-456", "owner-123")).toBe(false);
  });

  it("falla de forma segura cuando falta una identidad", () => {
    expect(isPersonalOwner(undefined, "owner-123")).toBe(false);
    expect(isPersonalOwner("owner-123", undefined)).toBe(false);
    expect(isPersonalOwner(null, null)).toBe(false);
  });
});
