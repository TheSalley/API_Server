import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, jest } from "@jest/globals";
import { ImagebaseClient, ImagebaseGroup, ImagebaseImage } from "./imagebase.client.js";
import { ImagebaseSyncService } from "./imagebase-sync.service.js";
import { PresetRecord } from "./preset.types.js";
import { PresetsRepository } from "./presets.repository.js";

const groups: ImagebaseGroup[] = [
  { id: 13, name: "新闻资讯", slug: "news", count: 2 },
  { id: 10, name: "企业文化", slug: "culture", count: 0 },
];

const images: ImagebaseImage[] = [
  {
    id: 146,
    title: "News-5",
    filename: "News-5.webp",
    thumb: "https://example.com/News-5-300.webp",
    large: "https://example.com/News-5-1024.webp",
    full: "https://example.com/News-5.webp",
    width: 1920,
    height: 1080,
  },
];

function existingPreset(): PresetRecord {
  return {
    id: "p_imagebase_g13",
    category: "imagebase_13",
    category_name: "新闻资讯",
    name: "新闻资讯",
    description: null,
    content: JSON.stringify({ texts: [], images: [] }),
    sort: 10,
    enabled: true,
    remark: "imagebase:group:13",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function createService(overrides: {
  groups?: ImagebaseGroup[];
  images?: ImagebaseImage[];
  existing?: PresetRecord | null;
} = {}) {
  const client = {
    listGroups: jest.fn(async () => overrides.groups ?? groups),
    listGroupImages: jest.fn(async (groupId: number) =>
      groupId === 10 ? [] : (overrides.images ?? images),
    ),
  } as unknown as ImagebaseClient;
  const repo = {
    findCategoryByName: jest.fn(() => null),
    findByRemark: jest.fn(() => overrides.existing ?? null),
    findByKey: jest.fn(() => null),
    findById: jest.fn(() => overrides.existing ?? null),
    syncImagebase: jest.fn(),
  } as unknown as PresetsRepository;
  return { service: new ImagebaseSyncService(client, repo), client, repo };
}

describe("ImagebaseSyncService", () => {
  it("maps groups to categories and images to a preset package", async () => {
    const { service, repo } = createService();

    const result = await service.sync();

    expect(result.groups).toBe(2);
    expect(result.images).toBe(1);
    expect(result.presets_created).toBe(1);
    expect(result.presets_updated).toBe(0);

    const [categories, presets, cleared] = (repo.syncImagebase as jest.Mock).mock
      .calls[0] as [unknown[], PresetRecord[], string[]];
    expect(categories).toHaveLength(2);
    expect(categories[0]).toEqual(
      expect.objectContaining({ key: "imagebase_13", name: "新闻资讯" }),
    );
    expect(presets).toHaveLength(1);
    expect(presets[0]).toEqual(
      expect.objectContaining({
        id: "p_imagebase_g13",
        category: "imagebase_13",
        name: "新闻资讯",
        remark: "imagebase:group:13",
      }),
    );
    expect(JSON.parse(presets[0].content)).toEqual({
      texts: [],
      images: [{ name: "News-5", url: "https://example.com/News-5.webp" }],
    });
    expect(cleared).toEqual([]);
  });

  it("keeps the existing preset id and clears stale packages for empty groups", async () => {
    const { service, repo } = createService({ existing: existingPreset() });

    const result = await service.sync();

    expect(result.presets_updated).toBe(1);
    const [categories, presets, cleared] = (repo.syncImagebase as jest.Mock).mock
      .calls[0] as [unknown[], PresetRecord[], string[]];
    expect(presets[0].id).toBe("p_imagebase_g13");
    expect(categories).toHaveLength(2);
    expect(cleared).toEqual(["p_imagebase_g13"]);
  });

  it("syncs only the requested groups", async () => {
    const { service, client } = createService();

    const result = await service.sync({ groups: [13] });

    expect(result.groups).toBe(1);
    expect(client.listGroupImages).toHaveBeenCalledTimes(1);
    expect(client.listGroupImages).toHaveBeenCalledWith(13);
  });

  it("rejects unknown requested groups and empty upstream data", async () => {
    await expect(createService().service.sync({ groups: [999] })).rejects.toThrow(
      BadRequestException,
    );
    await expect(createService({ groups: [] }).service.sync()).rejects.toThrow(
      BadRequestException,
    );
  });
});
