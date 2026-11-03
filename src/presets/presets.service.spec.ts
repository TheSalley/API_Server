import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { describe, expect, it, jest } from "@jest/globals";
import { AppConfig } from "../config/configuration.js";
import { CreatePresetDto } from "./dto/create-preset.dto.js";
import { UpdatePresetDto } from "./dto/update-preset.dto.js";
import { PresetRecord } from "./preset.types.js";
import { PresetsRepository } from "./presets.repository.js";
import { PresetsService } from "./presets.service.js";

function configService(): ConfigService<AppConfig, true> {
  const values: Partial<AppConfig> = {
    defaultLang: "en",
    supportedLangs: ["en"],
  };
  return {
    get: (key: keyof AppConfig) => values[key],
  } as unknown as ConfigService<AppConfig, true>;
}

function record(overrides: Partial<PresetRecord> = {}): PresetRecord {
  return {
    id: "p_1",
    widget_type: "button",
    field: "text",
    lang: "en",
    content: "Go",
    label: "按钮文案",
    field_type: "text",
    maxlength: 50,
    sort: 10,
    enabled: true,
    remark: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function createService(repository: Partial<PresetsRepository> = {}) {
  const repo = {
    count: jest.fn(() => 1),
    findByKey: jest.fn(() => null),
    findById: jest.fn(() => null),
    insert: jest.fn((value: PresetRecord) => value),
    updateById: jest.fn((_id: string, value: Partial<PresetRecord>) =>
      record(value as Partial<PresetRecord>),
    ),
    all: jest.fn(() => []),
    ...repository,
  } as unknown as PresetsRepository;
  return { service: new PresetsService(repo, configService()), repo };
}

describe("PresetsService", () => {
  it("completes label, field type and maxlength from the widget schema", () => {
    const { service, repo } = createService();
    service.create({
      widget_type: "button",
      field: "text",
      content: "Go",
    } as CreatePresetDto);

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        widget_type: "button",
        field: "text",
        content: "Go",
        label: "按钮文案",
        field_type: "text",
        maxlength: 50,
        enabled: true,
      }),
    );
  });

  it("rejects unsupported widget/field combinations and language values", () => {
    const { service } = createService();
    expect(() =>
      service.create({
        widget_type: "heading",
        field: "not-a-field",
        content: "Hello",
      } as CreatePresetDto),
    ).toThrow(BadRequestException);

    expect(() =>
      service.create({
        widget_type: "button",
        field: "text",
        content: "Go",
        lang: "fr",
      } as CreatePresetDto),
    ).toThrow(BadRequestException);
  });

  it("rejects non-numeric values for numeric fields", () => {
    const { service } = createService();
    expect(() =>
      service.create({
        widget_type: "counter",
        field: "ending_number",
        content: "not-a-number",
      } as CreatePresetDto),
    ).toThrow(BadRequestException);
  });

  it("refreshes label and field metadata when the widget key changes", () => {
    const existing = record({
      id: "p_1",
      widget_type: "heading",
      field: "title",
      content: "Old title",
      label: "标题",
      field_type: "text",
      maxlength: 100,
    });
    const { service, repo } = createService({
      findById: jest.fn(() => existing),
    } as Partial<PresetsRepository>);

    service.update("p_1", {
      widget_type: "button",
      field: "text",
      content: "Go",
    } as UpdatePresetDto);

    expect(repo.updateById).toHaveBeenCalledWith(
      "p_1",
      expect.objectContaining({
        widget_type: "button",
        field: "text",
        label: "按钮文案",
        field_type: "text",
        maxlength: 50,
      }),
    );
  });
});
