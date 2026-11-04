import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { createId, nowIso } from "../common/utils/id.js";
import { CreatePresetCategoryDto } from "./dto/create-preset-category.dto.js";
import { CreatePresetDto, PresetContentDto } from "./dto/create-preset.dto.js";
import { ListPresetsQueryDto } from "./dto/list-presets-query.dto.js";
import { UpdatePresetCategoryDto } from "./dto/update-preset-category.dto.js";
import { UpdatePresetDto } from "./dto/update-preset.dto.js";
import {
  PresetCategoryRecord,
  PresetContent,
  PresetRecord,
  PresetView,
} from "./preset.types.js";
import { PresetsRepository } from "./presets.repository.js";
import { seedPresetCategories, seedPresets } from "./presets.seed.js";

@Injectable()
export class PresetsService implements OnModuleInit {
  private readonly logger = new Logger(PresetsService.name);

  constructor(private readonly repository: PresetsRepository) {}

  onModuleInit(): void {
    if (this.repository.countCategories() === 0) {
      const categories = seedPresetCategories();
      this.repository.insertCategories(categories);
      this.logger.log(`已写入 ${categories.length} 个预设分类`);
    }
    if (this.repository.count() === 0) {
      const records = seedPresets();
      this.repository.insertMany(records);
      this.logger.log(`已写入 ${records.length} 条预设内容包`);
    }
  }

  list(query: ListPresetsQueryDto) {
    const result = this.repository.list({
      page: query.page ?? 1,
      pageSize: query.page_size ?? 20,
      category: query.category || undefined,
      enabled: query.enabled ?? null,
      keyword: query.keyword || undefined,
    });
    return { list: result.list.map((record) => this.toView(record)), total: result.total };
  }

  create(dto: CreatePresetDto): PresetView {
    const category = this.required(dto.category, "category");
    this.ensureCategoryExists(category);
    const name = this.required(dto.name, "name");
    if (this.repository.findByKey(category, name)) {
      throw new BadRequestException("该分类下已存在同名内容包，请使用更新接口");
    }

    const content = this.normalizeContent(dto.content);
    const now = nowIso();
    const record = this.repository.insert({
      id: createId("p_"),
      category,
      category_name: null,
      name,
      description: dto.description || null,
      content: JSON.stringify(content),
      sort: dto.sort ?? 10,
      enabled: dto.enabled ?? true,
      remark: dto.remark || null,
      created_at: now,
      updated_at: now,
    });
    return this.toView(record);
  }

  update(idValue: string | undefined, dto: UpdatePresetDto): PresetView {
    const id = this.required(idValue, "id");
    const existing = this.repository.findById(id);
    if (!existing) throw new NotFoundException("预设内容包不存在");

    const category = this.required(dto.category ?? existing.category, "category");
    this.ensureCategoryExists(category);
    const name = this.required(dto.name ?? existing.name, "name");
    const duplicate = this.repository.findByKey(category, name);
    if (duplicate && duplicate.id !== id) {
      throw new BadRequestException("该分类下已存在同名内容包");
    }

    const content =
      dto.content !== undefined
        ? JSON.stringify(this.normalizeContent(dto.content))
        : existing.content;

    const updated = this.repository.updateById(id, {
      category,
      name,
      description:
        dto.description !== undefined ? dto.description || null : existing.description,
      content,
      sort: dto.sort ?? existing.sort,
      enabled: dto.enabled ?? existing.enabled,
      remark: dto.remark !== undefined ? dto.remark || null : existing.remark,
    })!;
    return this.toView(updated);
  }

  remove(idValue: string | undefined): { id: string } {
    const id = this.required(idValue, "id");
    const removed = this.repository.removeById(id);
    if (!removed) throw new NotFoundException("预设内容包不存在");
    return { id: removed.id };
  }

  listCategories(): PresetCategoryRecord[] {
    return this.repository.allCategories();
  }

  createCategory(dto: CreatePresetCategoryDto): PresetCategoryRecord {
    const name = this.required(dto.name, "name");
    if (this.repository.findCategoryByName(name)) {
      throw new BadRequestException("分类名称已存在");
    }
    const key = dto.key?.trim() || createId("cat_");
    if (this.repository.findCategoryByKey(key)) {
      throw new BadRequestException("分类 key 已存在");
    }

    const now = nowIso();
    return this.repository.insertCategory({
      key,
      name,
      description: dto.description || null,
      sort: dto.sort ?? 10,
      created_at: now,
      updated_at: now,
    });
  }

  updateCategory(
    keyValue: string | undefined,
    dto: UpdatePresetCategoryDto,
  ): PresetCategoryRecord {
    const key = this.required(keyValue, "key");
    const existing = this.repository.findCategoryByKey(key);
    if (!existing) throw new NotFoundException("预设分类不存在");

    const name = dto.name !== undefined ? this.required(dto.name, "name") : existing.name;
    const duplicate = this.repository.findCategoryByName(name);
    if (duplicate && duplicate.key !== key) {
      throw new BadRequestException("分类名称已存在");
    }

    return this.repository.updateCategory(key, {
      name,
      description:
        dto.description !== undefined ? dto.description || null : existing.description,
      sort: dto.sort ?? existing.sort,
    })!;
  }

  removeCategory(keyValue: string | undefined): { key: string } {
    const key = this.required(keyValue, "key");
    const existing = this.repository.findCategoryByKey(key);
    if (!existing) throw new NotFoundException("预设分类不存在");
    if (this.repository.countByCategory(key) > 0) {
      throw new BadRequestException("该分类下还有内容包，请先移走或删除");
    }
    this.repository.removeCategory(key);
    return { key };
  }

  private ensureCategoryExists(category: string): void {
    if (!this.repository.findCategoryByKey(category)) {
      throw new BadRequestException(`分类不存在：${category}`);
    }
  }

  private required(value: string | undefined, label: string): string {
    const normalized = (value ?? "").trim();
    if (!normalized) throw new BadRequestException(`${label} 不能为空`);
    return normalized;
  }

  private normalizeContent(content: PresetContentDto): PresetContent {
    const texts = (content.texts ?? [])
      .map((item) => ({
        title: (item.title || "").trim(),
        content: (item.content || "").trim(),
      }))
      .filter((item) => item.content);

    const images = (content.images ?? [])
      .map((item) => ({
        name: (item.name || "").trim(),
        url: (item.url || "").trim(),
      }))
      .filter((item) => item.url);

    for (const image of images) {
      if (!image.url.startsWith("/") && !/^https?:\/\//i.test(image.url)) {
        throw new BadRequestException(
          `图片地址必须是绝对 URL 或以 / 开头的站内 URL：${image.url}`,
        );
      }
    }

    if (texts.length === 0 && images.length === 0) {
      throw new BadRequestException("content 至少要包含一条文案或一张图片");
    }
    return { texts, images };
  }

  private toView(record: PresetRecord): PresetView {
    const { content, ...rest } = record;
    return { ...rest, content: this.parseContent(content) };
  }

  private parseContent(value: string): PresetContent {
    try {
      const parsed = JSON.parse(value) as Partial<PresetContent>;
      return {
        texts: Array.isArray(parsed?.texts) ? parsed.texts : [],
        images: Array.isArray(parsed?.images) ? parsed.images : [],
      };
    } catch {
      return { texts: [], images: [] };
    }
  }
}
