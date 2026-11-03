import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Redirect,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppConfig } from "../config/configuration.js";

@ApiExcludeController()
@Controller()
export class PanelController {
  private readonly indexPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "public",
    "index.html",
  );

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  @Get()
  @Redirect("/panel", 302)
  root(): void {
    this.assertEnabled();
  }

  @Get("panel")
  @Header("Cache-Control", "no-store")
  panel(@Res() response: Response): void {
    this.assertEnabled();
    response.sendFile(this.indexPath);
  }

  private assertEnabled(): void {
    if (!this.config.get("panelEnabled", { infer: true })) {
      throw new NotFoundException("接口不存在");
    }
  }
}
