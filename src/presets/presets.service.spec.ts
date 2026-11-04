import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, jest } from "@jest/globals";
import { CreatePresetDto } from "./dto/create-preset.dto.js";
import { UpdatePresetDto } from "./dto/update-preset.dto.js";
import { PresetCategoryRecord, PresetRecord } from "./preset.types.js";
import { PresetsRepository } from "./presets.repository.js";
import { PresetsService } from "./presets.service.js";

function record(overrides: Partial<PresetRecord> = {}): PresetRecord {
  return {
    id: "p_1",
    category: "common",
    category_name: "通用",
    name: "通用首页",
    description: "通用素材",
    content: JSON.stringify({
      texts: [{ title: "主张", content: "把复杂留给我们" }],
      images: [{ name: "主图", url: "https://example.com/a.png" }],
    }),
    sort: 10,
    enabled: true,
    remark: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function category(overrides: Partial<PresetCategoryRecord> = {}): PresetCategoryRecord {
  return {
    key: "common",
    name: "通用",
    description: "通用素材",
    sort: 10,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createService(repository: Partial<PresetsRepository> = {}) {
  const repo = {
    count: jest.fn(() => 1),
    countCategories: jest.fn(() => 1),
    findByKey: jest.fn(() => null),
    findById: jest.fn(() => null),
    insert: jest.fn((value: PresetRecord) => value),
    updateById: jest.fn((_id: string, value: Partial<PresetRecord>) => record(value)),
    findCategoryByKey: jest.fn(() => category()),
    findCategoryByName: jest.fn(() => null),
    countByCategory: jest.fn(() => 0),
    insertCategory: jest.fn((value: PresetCategoryRecord) => value),
    updateCategory: jest.fn((_key: string, value: Partial<PresetCategoryRecord>) =>
      category(value),
    ),
    removeCategory: jest.fn(() => category()),
    ...repository,
  } as unknown as PresetsRepository;
  return { service: new PresetsService(repo), repo };
}

describe("PresetsService", () => {
  it("stores texts and images as a JSON content package", () => {
    const { service, repo } = createService();
    const result = service.create({
      category: "common",
      name: "通用首页",
      description: "不区分行业",
      content: {
        texts: [{ title: "主标题", content: "把复杂留给我们" }],
        images: [{ name: "主视觉", url: "https://example.com/banner.png" }],
      },
    } as CreatePresetDto);

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "common",
        name: "通用首页",
        description: "不区分行业",
        content: JSON.stringify({
          texts: [{ title: "主标题", content: "把复杂留给我们" }],
          images: [{ name: "主视觉", url: "https://example.com/banner.png" }],
        }),
        enabled: true,
      }),
    );
    expect(result.content.texts[0].content).toBe("把复杂留给我们");
  });

  it("rejects unknown categories, duplicate names and empty content", () => {
    const { service } = createService({
      findCategoryByKey: jest.fn(() => null),
    } as Partial<PresetsRepository>);
    expect(() =>
      service.create({
        category: "missing",
        name: "包名",
        content: { texts: [{ title: "标题", content: "内容" }] },
      } as CreatePresetDto),
    ).toThrow(BadRequestException);

    const duplicate = createService({
      findByKey: jest.fn(() => record()),
    } as Partial<PresetsRepository>).service;
    expect(() =>
      duplicate.create({
        category: "common",
        name: "通用首页",
        content: { texts: [{ title: "标题", content: "内容" }] },
      } as CreatePresetDto),
    ).toThrow(BadRequestException);

    const { service: emptyService } = createService();
    expect(() =>
      emptyService.create({
        category: "common",
        name: "空包",
        content: { texts: [], images: [] },
      } as CreatePresetDto),
    ).toThrow(BadRequestException);
  });

  it("rejects invalid image urls", () => {
    const { service } = createService();
    expect(() =>
      service.create({
        category: "common",
        name: "坏图片",
        content: { images: [{ name: "图", url: "not-a-url" }] },
      } as CreatePresetDto),
    ).toThrow(BadRequestException);
  });

  it("updates the content package JSON", () => {
    const existing = record();
    const { service, repo } = createService({
      findById: jest.fn(() => existing),
    } as Partial<PresetsRepository>);

    service.update("p_1", {
      content: {
        texts: [{ title: "新主张", content: "更新后的文案" }],
        images: [],
      },
    } as UpdatePresetDto);

    expect(repo.updateById).toHaveBeenCalledWith(
      "p_1",
      expect.objectContaining({
        content: JSON.stringify({
          texts: [{ title: "新主张", content: "更新后的文案" }],
          images: [],
        }),
      }),
    );
  });

  it("does not delete a category that still has content packages", () => {
    const { service } = createService({
      countByCategory: jest.fn(() => 2),
    } as Partial<PresetsRepository>);
    expect(() => service.removeCategory("common")).toThrow(BadRequestException);
  });
});
