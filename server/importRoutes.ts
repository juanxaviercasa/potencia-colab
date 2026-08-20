import type { Express, Request, Response } from "express";
import express from "express";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { recordImportedFile } from "./db";
import { isPersonalOwner } from "./security";
import { storagePut } from "./storage";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["csv", "json", "parquet"]);

export function validateImportUpload(fileType: string, bytes: unknown) {
  if (!ALLOWED_TYPES.has(fileType)) return { status: 400, error: "Formato no permitido. Usa CSV, JSON o Parquet." } as const;
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) return { status: 400, error: "No se recibió contenido de archivo." } as const;
  if (bytes.length > MAX_UPLOAD_BYTES) return { status: 413, error: "El archivo supera el límite de 10 MB." } as const;
  return null;
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "dataset";
}

export async function importUploadHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user || !isPersonalOwner(user.openId, ENV.ownerOpenId)) {
      return res.status(403).json({ error: "La importación está disponible solo para el propietario." });
    }

    const fileType = String(req.header("x-file-type") ?? "").toLowerCase();
    const encodedName = req.header("x-file-name") ?? "";
    const name = safeName(decodeURIComponent(encodedName));
    const mimeType = String(req.header("x-file-mime") ?? "application/octet-stream").slice(0, 128);
    const bytes = req.body;

    const validationError = validateImportUpload(fileType, bytes);
    if (validationError) return res.status(validationError.status).json({ error: validationError.error });

    const key = `personal-imports/${user.id}/${Date.now()}-${safeName(name)}`;
    const stored = await storagePut(key, bytes, mimeType);
    const id = await recordImportedFile(user.id, {
      name,
      fileType: fileType as "csv" | "json" | "parquet",
      mimeType,
      byteSize: bytes.length,
      storageKey: stored.key,
      storageUrl: stored.url,
    });
    return res.status(201).json({ id, name, fileType, byteSize: bytes.length, url: stored.url });
  } catch (error) {
    console.error("[Imports] upload failed", error);
    return res.status(500).json({ error: "No se pudo guardar la importación. Intenta de nuevo." });
  }
}

export function registerImportRoutes(app: Express) {
  app.post(
    "/api/imports/upload",
    express.raw({ type: "application/octet-stream", limit: `${MAX_UPLOAD_BYTES}b` }),
    importUploadHandler,
  );
}
