import { BadRequestException } from "@nestjs/common";
import path from "node:path";

export interface DetectedImageType {
  mime: string;
  extension: string;
  extensions: readonly string[];
}

const JPEG: DetectedImageType = {
  mime: "image/jpeg",
  extension: "jpg",
  extensions: ["jpg", "jpeg"],
};
const PNG: DetectedImageType = {
  mime: "image/png",
  extension: "png",
  extensions: ["png"],
};
const GIF: DetectedImageType = {
  mime: "image/gif",
  extension: "gif",
  extensions: ["gif"],
};
const WEBP: DetectedImageType = {
  mime: "image/webp",
  extension: "webp",
  extensions: ["webp"],
};
const BMP: DetectedImageType = {
  mime: "image/bmp",
  extension: "bmp",
  extensions: ["bmp"],
};
const AVIF: DetectedImageType = {
  mime: "image/avif",
  extension: "avif",
  extensions: ["avif"],
};
const SVG: DetectedImageType = {
  mime: "image/svg+xml",
  extension: "svg",
  extensions: ["svg"],
};

function matchesAscii(buffer: Buffer, offset: number, value: string): boolean {
  if (buffer.length < offset + value.length) return false;
  return buffer.subarray(offset, offset + value.length).toString("ascii") === value;
}

function isAvif(buffer: Buffer): boolean {
  if (buffer.length < 12 || !matchesAscii(buffer, 4, "ftyp")) return false;
  const majorBrand = buffer.subarray(8, 12).toString("ascii");
  if (majorBrand === "avif" || majorBrand === "avis") return true;

  const compatibleBrandsEnd = Math.min(buffer.length, 64);
  for (let offset = 16; offset + 4 <= compatibleBrandsEnd; offset += 4) {
    const brand = buffer.subarray(offset, offset + 4).toString("ascii");
    if (brand === "avif" || brand === "avis") return true;
  }
  return false;
}

function isSvg(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 16 * 1024).toString("utf8").replace(/^\uFEFF/, "").trimStart();
  if (!head.startsWith("<")) return false;
  return /<svg(?:\s|>)/i.test(head);
}

export function detectImageType(buffer: Buffer): DetectedImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return JPEG;
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return PNG;
  }
  if (matchesAscii(buffer, 0, "GIF87a") || matchesAscii(buffer, 0, "GIF89a")) return GIF;
  if (matchesAscii(buffer, 0, "RIFF") && matchesAscii(buffer, 8, "WEBP")) return WEBP;
  if (matchesAscii(buffer, 0, "BM")) return BMP;
  if (isAvif(buffer)) return AVIF;
  if (isSvg(buffer)) return SVG;
  return null;
}

function normalizeDeclaredMime(mime: string): string {
  const normalized = mime.trim().toLowerCase();
  if (normalized === "image/jpg" || normalized === "image/pjpeg") return "image/jpeg";
  if (normalized === "image/x-png") return "image/png";
  return normalized;
}

export function sanitizeOriginalName(filename: string): string {
  const base = path.basename(String(filename || "").replace(/\\/g, "/"));
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 255);
  return cleaned || "unnamed";
}

export function validateImageUpload(
  file: Express.Multer.File | undefined,
  allowedImageTypes: string[],
): DetectedImageType {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new BadRequestException("图片内容为空");
  }

  const originalName = sanitizeOriginalName(file.originalname);
  const extension = path.extname(originalName).slice(1).toLowerCase();
  const allowed = new Set(allowedImageTypes.map((item) => item.trim().toLowerCase()));

  if (!extension || !allowed.has(extension)) {
    throw new BadRequestException(
      `不支持的图片类型（允许：${[...allowed].join(", ")}）`,
    );
  }

  const detected = detectImageType(file.buffer);
  if (!detected) {
    throw new BadRequestException("文件内容不是受支持的图片格式");
  }
  if (!detected.extensions.includes(extension)) {
    throw new BadRequestException("图片扩展名与文件内容不一致");
  }

  const declaredMime = normalizeDeclaredMime(file.mimetype || "");
  if (
    declaredMime &&
    declaredMime !== "application/octet-stream" &&
    declaredMime !== detected.mime
  ) {
    throw new BadRequestException("图片 MIME 类型与文件内容不一致");
  }

  if (!detected.extensions.some((item) => allowed.has(item))) {
    throw new BadRequestException(
      `不支持的图片类型（允许：${[...allowed].join(", ")}）`,
    );
  }

  return detected;
}
