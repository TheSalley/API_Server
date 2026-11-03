import path from "node:path";
import { fileURLToPath } from "node:url";

export interface AppConfig {
  port: number;
  host: string;
  dbFile: string;
  uploadDir: string;
  uploadUrlPrefix: string;
  maxUploadSize: number;
  allowedImageTypes: string[];
  defaultLang: string;
  supportedLangs: string[];
  corsOrigins: string[] | "*";
  panelEnabled: boolean;
}

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function parseCsv(value: string | undefined, fallback: string): string[] {
  const values = (value ?? fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length > 0 ? values : [fallback];
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") return fallback;
  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

function resolveFromRoot(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(PROJECT_ROOT, value);
}

function normalizeUrlPrefix(value: string): string {
  const normalized = `/${value.replace(/^\/+|\/+$/g, "")}`;
  return normalized === "/" ? "/uploads" : normalized;
}

export function configuration(): AppConfig {
  const port = Number(process.env.PORT ?? 3501);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT 必须是 1-65535 的整数，当前值：${process.env.PORT}`);
  }

  const maxUploadSize = Number(process.env.MAX_UPLOAD_SIZE ?? 20 * 1024 * 1024);
  if (!Number.isInteger(maxUploadSize) || maxUploadSize <= 0) {
    throw new Error(`MAX_UPLOAD_SIZE 必须是正整数，当前值：${process.env.MAX_UPLOAD_SIZE}`);
  }

  const supportedLangs = parseCsv(process.env.SUPPORTED_LANGS, "en");
  const defaultLang = (process.env.DEFAULT_LANG ?? "en").trim() || "en";
  if (!supportedLangs.includes(defaultLang)) {
    throw new Error(`DEFAULT_LANG 必须包含在 SUPPORTED_LANGS 中，当前值：${defaultLang}`);
  }

  const corsList = parseCsv(process.env.CORS_ORIGINS, "*");
  const corsOrigins = corsList.includes("*") ? "*" : corsList;

  return {
    port,
    host: process.env.HOST ?? "0.0.0.0",
    dbFile: resolveFromRoot(process.env.DB_FILE ?? path.join("src", "data", "app.db")),
    uploadDir: resolveFromRoot(process.env.UPLOAD_DIR ?? path.join("src", "data", "uploads")),
    uploadUrlPrefix: normalizeUrlPrefix(process.env.UPLOAD_URL_PREFIX ?? "/uploads"),
    maxUploadSize,
    allowedImageTypes: parseCsv(
      process.env.ALLOWED_IMAGE_TYPES,
      "jpg,jpeg,png,gif,webp,bmp,avif",
    ).map((item) => item.toLowerCase()),
    defaultLang,
    supportedLangs,
    corsOrigins,
    panelEnabled: parseBoolean(process.env.PANEL_ENABLED, true),
  };
}
