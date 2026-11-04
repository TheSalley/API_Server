import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Res,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Response } from "express";

interface SeedImageSpec {
  title: string;
  eyebrow: string;
  accent: string;
  secondary: string;
}

const SEED_IMAGES: Record<string, SeedImageSpec> = {
  "solar1.svg": {
    title: "光伏电站航拍",
    eyebrow: "SOLAR ARRAY",
    accent: "#0f766e",
    secondary: "#99f6e4",
  },
  "solar2.svg": {
    title: "逆变器特写",
    eyebrow: "INVERTER",
    accent: "#0e7490",
    secondary: "#a5f3fc",
  },
  "battery1.svg": {
    title: "储能柜外观",
    eyebrow: "STORAGE",
    accent: "#15803d",
    secondary: "#bbf7d0",
  },
  "kitchen1.svg": {
    title: "厨房样板间",
    eyebrow: "KITCHEN",
    accent: "#b45309",
    secondary: "#fde68a",
  },
  "wardrobe1.svg": {
    title: "衣帽间",
    eyebrow: "WARDROBE",
    accent: "#9a3412",
    secondary: "#fed7aa",
  },
  "smarthome1.svg": {
    title: "智能客厅",
    eyebrow: "SMART LIVING",
    accent: "#0369a1",
    secondary: "#bae6fd",
  },
  "cobot1.svg": {
    title: "产线装配",
    eyebrow: "COBOT",
    accent: "#475569",
    secondary: "#e2e8f0",
  },
  "cnc1.svg": {
    title: "五轴加工中心",
    eyebrow: "CNC",
    accent: "#1d4ed8",
    secondary: "#dbeafe",
  },
  "cnc2.svg": {
    title: "车间实拍",
    eyebrow: "WORKSHOP",
    accent: "#334155",
    secondary: "#cbd5e1",
  },
  "home1.svg": {
    title: "主视觉背景",
    eyebrow: "BRAND HERO",
    accent: "#065f46",
    secondary: "#d1fae5",
  },
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderSeedImage(spec: SeedImageSpec, index: number): string {
  const title = escapeXml(spec.title);
  const eyebrow = escapeXml(spec.eyebrow);
  const serial = String(index + 1).padStart(2, "0");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${spec.accent}"/>
      <stop offset="1" stop-color="${spec.secondary}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".72"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="noise" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#ffffff" stroke-opacity=".13" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="640" height="400" fill="url(#bg)"/>
  <rect width="640" height="400" fill="url(#grid)"/>
  <circle cx="536" cy="76" r="188" fill="url(#glow)"/>
  <circle cx="86" cy="362" r="124" fill="#0f172a" opacity=".14"/>
  <path d="M-40 336 C 116 258 234 390 388 300 C 486 244 568 268 680 208" fill="none" stroke="#ffffff" stroke-opacity=".2" stroke-width="2"/>
  <path d="M-20 108 C 112 174 222 62 354 126 C 472 184 548 132 670 78" fill="none" stroke="#ffffff" stroke-opacity=".16" stroke-width="1.5"/>

  <rect x="44" y="42" width="552" height="316" rx="28" fill="#0f172a" opacity=".18"/>
  <rect x="44" y="42" width="552" height="316" rx="28" fill="none" stroke="#ffffff" stroke-opacity=".32"/>
  <text x="76" y="94" fill="#ffffff" fill-opacity=".8" font-family="Segoe UI, Microsoft YaHei, sans-serif" font-size="13" font-weight="700" letter-spacing="3">${eyebrow}</text>
  <text x="76" y="286" fill="#ffffff" font-family="Segoe UI, Microsoft YaHei, sans-serif" font-size="42" font-weight="700">${title}</text>
  <text x="78" y="318" fill="#ffffff" fill-opacity=".72" font-family="Segoe UI, Microsoft YaHei, sans-serif" font-size="14" letter-spacing="1">MATERIAL PRESET / ${serial}</text>
  <text x="570" y="318" text-anchor="end" fill="#ffffff" fill-opacity=".2" font-family="Segoe UI, Microsoft YaHei, sans-serif" font-size="112" font-weight="700">${serial}</text>
  <g fill="none" stroke="#ffffff" stroke-opacity=".42" stroke-width="2">
    <rect x="472" y="118" width="72" height="72" rx="18"/>
    <path d="M492 154 h32 M508 138 v32"/>
  </g>
  <rect width="640" height="400" filter="url(#noise)" opacity=".065"/>
</svg>`;
}

@ApiExcludeController()
@Controller("seed")
export class SeedImagesController {
  @Get(":file")
  @Header("Cache-Control", "public, max-age=604800, immutable")
  @Header("X-Content-Type-Options", "nosniff")
  @Header("Cross-Origin-Resource-Policy", "cross-origin")
  get(@Param("file") file: string, @Res() response: Response): void {
    const index = Object.keys(SEED_IMAGES).indexOf(file);
    const spec = SEED_IMAGES[file];
    if (index < 0 || !spec) throw new NotFoundException("图片不存在");
    response.type("image/svg+xml").send(renderSeedImage(spec, index));
  }
}
