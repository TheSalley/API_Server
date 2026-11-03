import { randomUUID } from "node:crypto";

export function createId(prefix = ""): string {
  return prefix + randomUUID().replace(/-/g, "");
}

export function nowIso(): string {
  return new Date().toISOString();
}
