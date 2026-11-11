import { BadGatewayException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../config/configuration.js";

export interface ImagebaseGroup {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface ImagebaseImage {
  id: number;
  title: string;
  filename: string;
  thumb: string;
  large: string;
  full: string;
  width: number;
  height: number;
}

interface GroupListResponse {
  items?: ImagebaseGroup[];
}

interface ImageListResponse {
  items?: ImagebaseImage[];
  page?: number;
  total?: number;
  pages?: number;
}

const PAGE_SIZE = 100;
const MAX_PAGES = 1000;
const REQUEST_TIMEOUT_MS = 30000;
const REQUEST_ATTEMPTS = 3;

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
}

@Injectable()
export class ImagebaseClient {
  private readonly baseUrl: string;

  constructor(config: ConfigService<AppConfig, true>) {
    this.baseUrl = config
      .get("imagebaseApiBaseUrl", { infer: true })
      .replace(/\/+$/, "");
  }

  async listGroups(): Promise<ImagebaseGroup[]> {
    const body = await this.getJson<GroupListResponse>("groups");
    return (body.items ?? [])
      .filter((item) => Number.isFinite(Number(item.id)))
      .map((item) => ({
        id: Number(item.id),
        name: decodeHtml(String(item.name ?? "")).trim(),
        slug: String(item.slug ?? ""),
        count: Number(item.count ?? 0),
      }))
      .filter((item) => item.name);
  }

  async listGroupImages(groupId: number): Promise<ImagebaseImage[]> {
    const images: ImagebaseImage[] = [];
    let page = 1;
    let pages = 1;

    do {
      const params = new URLSearchParams({
        group: String(groupId),
        page: String(page),
        per_page: String(PAGE_SIZE),
      });
      const body = await this.getJson<ImageListResponse>(`images?${params.toString()}`);
      for (const item of body.items ?? []) {
        const url = String(item.full || item.large || item.thumb || "").trim();
        if (!url) continue;
        images.push({
          id: Number(item.id),
          title: decodeHtml(String(item.title ?? "")).trim(),
          filename: String(item.filename ?? ""),
          thumb: String(item.thumb ?? ""),
          large: String(item.large ?? ""),
          full: url,
          width: Number(item.width ?? 0),
          height: Number(item.height ?? 0),
        });
      }
      pages = Math.min(Math.max(Number(body.pages ?? 1), 1), MAX_PAGES);
      page += 1;
    } while (page <= pages);

    return images;
  }

  private async getJson<T>(path: string): Promise<T> {
    let response: Response | null = null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= REQUEST_ATTEMPTS; attempt += 1) {
      try {
        response = await fetch(`${this.baseUrl}/${path}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (response.ok || attempt === REQUEST_ATTEMPTS) break;
        lastError = new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
        if (attempt === REQUEST_ATTEMPTS) break;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }

    if (!response) {
      throw new BadGatewayException(
        `请求 ImageBase 失败：${(lastError as Error)?.message ?? "未知错误"}`,
      );
    }
    if (!response.ok) {
      throw new BadGatewayException(`ImageBase 返回 ${response.status}：${path}`);
    }
    try {
      return (await response.json()) as T;
    } catch {
      throw new BadGatewayException("ImageBase 返回的不是合法 JSON");
    }
  }
}
