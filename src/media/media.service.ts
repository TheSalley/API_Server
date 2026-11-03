import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import fs from "node:fs";
import path from "node:path";
import { createId, nowIso } from "../common/utils/id.js";
import { AppConfig } from "../config/configuration.js";
import { ListMediaQueryDto } from "./dto/list-media-query.dto.js";
import { sanitizeOriginalName, validateImageUpload } from "./media-file.util.js";
import { MediaRepository } from "./media.repository.js";
import { MediaRecord } from "./media.types.js";

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir: string;
  private readonly uploadUrlPrefix: string;
  private readonly allowedImageTypes: string[];
  private readonly maxUploadSize: number;

  constructor(
    private readonly repository: MediaRepository,
    config: ConfigService<AppConfig, true>,
  ) {
    this.uploadDir = config.get("uploadDir", { infer: true });
    this.uploadUrlPrefix = config.get("uploadUrlPrefix", { infer: true });
    this.allowedImageTypes = config.get("allowedImageTypes", { infer: true });
    this.maxUploadSize = config.get("maxUploadSize", { infer: true });
  }

  list(query: ListMediaQueryDto) {
    return this.repository.list({
      page: query.page ?? 1,
      pageSize: query.page_size ?? 20,
      keyword: query.keyword || undefined,
    });
  }

  findById(id: string): MediaRecord {
    const normalized = String(id || "").trim();
    if (!normalized) throw new BadRequestException("id 不能为空");
    const record = this.repository.findById(normalized);
    if (!record) throw new NotFoundException("媒体不存在");
    return record;
  }

  async upload(file: Express.Multer.File | undefined): Promise<MediaRecord> {
    if (!file) throw new BadRequestException("缺少 file 字段");
    if (file.buffer.length > this.maxUploadSize) {
      throw new PayloadTooLargeException(
        `图片大小不能超过 ${Math.round(this.maxUploadSize / 1024 / 1024)}MB`,
      );
    }

    const detected = validateImageUpload(file, this.allowedImageTypes);
    const filename = `${createId("img_")}.${detected.extension}`;
    const absolutePath = path.join(this.uploadDir, filename);
    const now = nowIso();

    await fs.promises.mkdir(this.uploadDir, { recursive: true });
    try {
      await fs.promises.writeFile(absolutePath, file.buffer, { flag: "wx" });
    } catch (error) {
      this.logger.error(`写入上传文件失败: ${(error as Error).message}`);
      throw new BadRequestException("保存图片失败，请稍后重试");
    }

    try {
      return this.repository.insert({
        id: createId("m_"),
        filename,
        original_name: sanitizeOriginalName(file.originalname),
        mime: detected.mime,
        size: file.buffer.length,
        url: `${this.uploadUrlPrefix}/${filename}`,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      await fs.promises.unlink(absolutePath).catch(() => undefined);
      throw error;
    }
  }

  async remove(id: string): Promise<{ id: string }> {
    const record = this.findById(id);
    if (this.repository.countPresetReferences(record.url) > 0) {
      throw new ConflictException("该图片正在被预设文案引用，无法删除");
    }

    this.repository.removeById(record.id);

    const filename = path.basename(record.filename);
    const baseDir = path.resolve(this.uploadDir);
    const absolutePath = path.resolve(baseDir, filename);
    if (path.dirname(absolutePath) === baseDir) {
      try {
        await fs.promises.unlink(absolutePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          this.logger.warn(`删除上传文件失败: ${(error as Error).message}`);
        }
      }
    } else {
      this.logger.warn(`拒绝删除上传目录外的文件: ${record.filename}`);
    }

    return { id: record.id };
  }
}
