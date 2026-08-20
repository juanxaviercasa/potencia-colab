import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  storagePut: vi.fn(),
  recordImportedFile: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("./db", () => ({ recordImportedFile: mocks.recordImportedFile }));

import type { Request, Response } from "express";
import { ENV } from "./_core/env";
import { importUploadHandler, validateImportUpload } from "./importRoutes";

function requestWith(headers: Record<string, string>, body: Buffer) {
  return { header: (name: string) => headers[name.toLowerCase()], body } as unknown as Request;
}

function responseSpy() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

describe("validateImportUpload", () => {
  it("acepta archivos CSV, JSON y Parquet no vacíos dentro del límite", () => {
    expect(validateImportUpload("csv", Buffer.from("a,b\n1,2"))).toBeNull();
    expect(validateImportUpload("json", Buffer.from('{"ok":true}'))).toBeNull();
    expect(validateImportUpload("parquet", Buffer.from([1, 2, 3]))).toBeNull();
  });

  it("rechaza tipos, cuerpos vacíos y archivos superiores a 10 MB antes del almacenamiento", () => {
    expect(validateImportUpload("xlsx", Buffer.from("x"))).toMatchObject({ status: 400 });
    expect(validateImportUpload("csv", Buffer.alloc(0))).toMatchObject({ status: 400 });
    expect(validateImportUpload("csv", Buffer.alloc(10 * 1024 * 1024 + 1))).toMatchObject({ status: 413 });
  });
});

describe("importUploadHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ id: 9, openId: ENV.ownerOpenId });
    mocks.storagePut.mockResolvedValue({ key: "personal-imports/9/muestra.csv", url: "/manus-storage/muestra.csv" });
    mocks.recordImportedFile.mockResolvedValue(81);
  });

  it("bloquea una cuenta que no es el propietario antes de tocar almacenamiento", async () => {
    mocks.authenticateRequest.mockResolvedValue({ id: 7, openId: "another-account" });
    const res = responseSpy();
    await importUploadHandler(requestWith({ "x-file-type": "csv" }, Buffer.from("a,b")), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it("valida el tipo HTTP antes de almacenar", async () => {
    const res = responseSpy();
    await importUploadHandler(requestWith({ "x-file-type": "xlsx", "x-file-name": "muestra.xlsx" }, Buffer.from("x")), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it("guarda y registra una importación permitida del propietario", async () => {
    const res = responseSpy();
    await importUploadHandler(requestWith({ "x-file-type": "csv", "x-file-name": "muestra, segura.csv", "x-file-mime": "text/csv" }, Buffer.from("a,b\n1,2")), res);
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringContaining("muestra__segura.csv"), expect.any(Buffer), "text/csv");
    expect(mocks.recordImportedFile).toHaveBeenCalledWith(9, expect.objectContaining({ name: "muestra__segura.csv", byteSize: 7 }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("informa un error controlado si falla el almacenamiento", async () => {
    mocks.storagePut.mockRejectedValue(new Error("S3 unavailable"));
    const res = responseSpy();
    await importUploadHandler(requestWith({ "x-file-type": "json", "x-file-name": "muestra.json" }, Buffer.from('{"ok":true}')), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining("No se pudo") }));
  });
});
