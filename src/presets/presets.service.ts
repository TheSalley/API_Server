import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../config/configuration.js";
import { createId, nowIso } from "../common/utils/id.js";
import { ApplyPresetsDto } from "./dto/apply-presets.dto.js";
import { CreatePresetDto } from "./dto/create-preset.dto.js";
import { ListPresetsQueryDto } from "./dto/list-presets-query.dto.js";
import { UpdatePresetDto } from "./dto/update-preset.dto.js";
import { applyPresetDefaults } from "./presets.apply.js";
import { PresetsRepository } from "./presets.repository.js";
import { PresetRecord } from "./preset.types.js";
import { seedPresets } from "./presets.seed.js";
import { fieldMetaOf, presetableFieldsOf } from "./widgets.js";

interface FieldMeta {
  label: string;
  type: string;
  maxlength?: number;
}

@Injectable()
export class PresetsService implements OnModuleInit {
  private readonly logger = new Logger(PresetsService.name);
  private readonly defaultLang: string;
  private readonly supportedLangs: string[];

  constructor(
    private readonly repository: PresetsRepository,
    config: ConfigService<AppConfig, true>,
  ) {
    this.defaultLang = config.get("defaultLang", { infer: true });
    this.supportedLangs = config.get("supportedLangs", { infer: true });
  }

  onModuleInit(): void {
    if (this.repository.count() > 0) return;
    const records = seedPresets();
    this.repository.insertMany(records);
    this.logger.log(`已写入 ${records.length} 条英文种子预设`);
  }

  list(query: ListPresetsQueryDto) {
    return this.repository.list({
      page: query.page ?? 1,
      pageSize: query.page_size ?? 20,
      widget_type: query.widget_type || undefined,
      field: query.field || undefined,
      lang: query.lang || undefined,
      enabled: query.enabled ?? null,
      keyword: query.keyword || undefined,
    });
  }

  create(dto: CreatePresetDto): PresetRecord {
    const widgetType = this.required(dto.widget_type, "widget_type");
    const field = this.required(dto.field, "field");
    const lang = this.resolveLang(dto.lang);
    const meta = this.resolveField(widgetType, field);
    const content = dto.content;

    this.validateContent(meta, content);
    this.validateFieldMetadata(dto, meta);
    if (this.repository.findByKey(widgetType, field, lang)) {
      throw new BadRequestException("该组件/字段/语言的预设文案已存在，请使用更新接口");
    }

    const now = nowIso();
    return this.repository.insert({
      id: createId("p_"),
      widget_type: widgetType,
      field,
      lang,
      content,
      label: dto.label || meta.label,
      field_type: meta.type,
      maxlength: meta.maxlength ?? null,
      sort: dto.sort ?? 10,
      enabled: dto.enabled ?? true,
      remark: dto.remark || null,
      created_at: now,
      updated_at: now,
    });
  }

  update(idValue: string | undefined, dto: UpdatePresetDto): PresetRecord {
    const id = this.required(idValue, "id");
    const existing = this.repository.findById(id);
    if (!existing) throw new NotFoundException("预设文案不存在");

    const widgetType = this.required(dto.widget_type ?? existing.widget_type, "widget_type");
    const field = this.required(dto.field ?? existing.field, "field");
    const lang = this.resolveLang(dto.lang ?? existing.lang);
    const meta = this.resolveField(widgetType, field);
    const content = dto.content ?? existing.content;

    this.validateContent(meta, content);
    this.validateFieldMetadata(dto, meta);

    const duplicate = this.repository.findByKey(widgetType, field, lang);
    if (duplicate && duplicate.id !== id) {
      throw new BadRequestException("该组件/字段/语言的预设文案已存在");
    }

    const keyChanged = widgetType !== existing.widget_type || field !== existing.field;
    const label =
      dto.label !== undefined
        ? dto.label || meta.label
        : keyChanged
          ? meta.label
          : existing.label;

    return this.repository.updateById(id, {
      widget_type: widgetType,
      field,
      lang,
      content,
      label,
      field_type: meta.type,
      maxlength: meta.maxlength ?? null,
      sort: dto.sort ?? existing.sort,
      enabled: dto.enabled ?? existing.enabled,
      remark: dto.remark !== undefined ? dto.remark || null : existing.remark,
    })!;
  }

  remove(idValue: string | undefined): { id: string } {
    const id = this.required(idValue, "id");
    const removed = this.repository.removeById(id);
    if (!removed) throw new NotFoundException("预设文案不存在");
    return { id: removed.id };
  }

  apply(dto: ApplyPresetsDto) {
    const lang = this.resolveLang(dto.lang);
    const presets = this.repository.all().filter((preset) => preset.enabled);
    const result = applyPresetDefaults(dto.elementor_data, {
      lang,
      defaultLang: this.defaultLang,
      presets,
    });
    return { data: result.data, applied: result.applied, lang };
  }

  private resolveField(widgetType: string, field: string): FieldMeta {
    const meta = fieldMetaOf(widgetType, field) as FieldMeta | null;
    const presettable = presetableFieldsOf(widgetType).some((item) => item.key === field);
    if (!meta || !presettable) {
      throw new BadRequestException(`不支持的组件/字段组合：${widgetType}.${field}`);
    }
    return meta;
  }

  private resolveLang(langValue: string | undefined): string {
    const lang = (langValue || this.defaultLang).trim();
    if (!this.supportedLangs.includes(lang)) {
      throw new BadRequestException(
        `不支持的 lang：${lang}（可选：${this.supportedLangs.join(", ")}）`,
      );
    }
    return lang;
  }

  private required(value: string | undefined, label: string): string {
    const normalized = (value ?? "").trim();
    if (!normalized) throw new BadRequestException(`${label} 不能为空`);
    return normalized;
  }

  private validateContent(meta: FieldMeta, content: string): void {
    if (!content.trim()) throw new BadRequestException("content 不能为空");
    if (meta.maxlength != null && content.length > meta.maxlength) {
      throw new BadRequestException(`content 长度不能超过 ${meta.maxlength}`);
    }
    if (meta.type === "number" && !Number.isFinite(Number(content))) {
      throw new BadRequestException("数字字段的 content 必须是数字");
    }
    if (
      meta.type === "image" &&
      !content.trim().startsWith("/") &&
      !/^https?:\/\//i.test(content.trim())
    ) {
      throw new BadRequestException("图片字段的 content 必须是绝对 URL 或以 / 开头的站内 URL");
    }
  }

  private validateFieldMetadata(
    dto: CreatePresetDto | UpdatePresetDto,
    meta: FieldMeta,
  ): void {
    if (dto.field_type !== undefined && dto.field_type !== meta.type) {
      throw new BadRequestException(`field_type 与字段定义不一致，应为 ${meta.type}`);
    }
    if (
      dto.maxlength !== undefined &&
      dto.maxlength !== null &&
      dto.maxlength !== (meta.maxlength ?? null)
    ) {
      throw new BadRequestException(
        `maxlength 与字段定义不一致，应为 ${meta.maxlength ?? "null"}`,
      );
    }
  }
}
