import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { nowIso } from "../common/utils/id.js";
import { ImagebaseClient, ImagebaseGroup, ImagebaseImage } from "./imagebase.client.js";
import { PresetCategoryRecord, PresetContent, PresetRecord } from "./preset.types.js";
import { PresetsRepository } from "./presets.repository.js";

export interface ImagebaseSyncOptions {
  groups?: number[];
}

export interface ImagebaseSyncGroupResult {
  group_id: number;
  group_name: string;
  category_key: string;
  preset_id: string | null;
  image_count: number;
  action: "created" | "updated" | "cleared";
}

export interface ImagebaseSyncResult {
  source: string;
  synced_at: string;
  groups: number;
  images: number;
  presets_created: number;
  presets_updated: number;
  presets_cleared: number;
  details: ImagebaseSyncGroupResult[];
}

function generatedCategoryKey(groupId: number): string {
  return `imagebase_${groupId}`;
}

function generatedPresetId(groupId: number): string {
  return `p_imagebase_g${groupId}`;
}

function toImages(images: ImagebaseImage[]): PresetContent["images"] {
  return images.map((image) => ({
    name: image.title || image.filename || `image-${image.id}`,
    url: image.full || image.large || image.thumb,
  }));
}

@Injectable()
export class ImagebaseSyncService {
  private readonly logger = new Logger(ImagebaseSyncService.name);
  private readonly source = "https://imagebase.yhct.site";

  constructor(
    private readonly client: ImagebaseClient,
    private readonly repository: PresetsRepository,
  ) {}

  async sync(options: ImagebaseSyncOptions = {}): Promise<ImagebaseSyncResult> {
    const requested = (options.groups ?? []).filter(
      (id) => Number.isInteger(id) && id > 0,
    );
    const allGroups = await this.client.listGroups();
    if (allGroups.length === 0) {
      throw new BadRequestException("ImageBase 未返回任何分组");
    }

    const groups = requested.length
      ? allGroups.filter((group) => requested.includes(group.id))
      : allGroups;
    if (requested.length && groups.length === 0) {
      throw new BadRequestException(`未找到指定分组：${requested.join(", ")}`);
    }

    const fetched: Array<{ group: ImagebaseGroup; images: ImagebaseImage[] }> = [];
    for (const group of groups) {
      fetched.push({ group, images: await this.client.listGroupImages(group.id) });
    }

    const now = nowIso();
    const categories: PresetCategoryRecord[] = [];
    const presets: PresetRecord[] = [];
    const clearedIds: string[] = [];
    const details: ImagebaseSyncGroupResult[] = [];
    let created = 0;
    let updated = 0;

    for (const [index, { group, images }] of fetched.entries()) {
      const categoryKey = this.resolveCategoryKey(group.name, group.id);
      categories.push({
        key: categoryKey,
        name: group.name,
        description: `ImageBase 分组，共 ${images.length} 张图片`,
        sort: (index + 1) * 10,
        created_at: now,
        updated_at: now,
      });

      const existing = this.findExistingPreset(categoryKey, group);
      const preset = this.buildPreset(group, categoryKey, images, existing, index, now);
      if (preset) {
        presets.push(preset);
        if (existing) updated += 1;
        else created += 1;
      } else if (existing) {
        clearedIds.push(existing.id);
      }

      details.push({
        group_id: group.id,
        group_name: group.name,
        category_key: categoryKey,
        preset_id: preset?.id ?? null,
        image_count: images.length,
        action: preset ? (existing ? "updated" : "created") : "cleared",
      });
    }

    this.repository.syncImagebase(categories, presets, clearedIds);

    const result: ImagebaseSyncResult = {
      source: this.source,
      synced_at: now,
      groups: groups.length,
      images: fetched.reduce((sum, item) => sum + item.images.length, 0),
      presets_created: created,
      presets_updated: updated,
      presets_cleared: clearedIds.length,
      details,
    };

    this.logger.log(
      `ImageBase 同步完成：${result.groups} 个分组 / ${result.images} 张图片`,
    );
    return result;
  }

  private resolveCategoryKey(name: string, groupId: number): string {
    const byName = this.repository.findCategoryByName(name);
    if (byName) return byName.key;
    return generatedCategoryKey(groupId);
  }

  private findExistingPreset(
    categoryKey: string,
    group: ImagebaseGroup,
  ): PresetRecord | null {
    return (
      this.repository.findByRemark(`imagebase:group:${group.id}`) ??
      this.repository.findByKey(categoryKey, group.name) ??
      this.repository.findById(generatedPresetId(group.id))
    );
  }

  private buildPreset(
    group: ImagebaseGroup,
    categoryKey: string,
    images: ImagebaseImage[],
    existing: PresetRecord | null,
    index: number,
    now: string,
  ): PresetRecord | null {
    if (images.length === 0) return null;

    const content: PresetContent = { texts: [], images: toImages(images) };
    return {
      id: existing?.id ?? generatedPresetId(group.id),
      category: categoryKey,
      category_name: null,
      name: group.name,
      description: `ImageBase 分组「${group.name}」，同步自 imagebase.yhct.site`,
      content: JSON.stringify(content),
      sort: (index + 1) * 10,
      enabled: true,
      remark: `imagebase:group:${group.id}`,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
  }
}
