import { describe, expect, it } from "@jest/globals";
import { PresetRecord } from "./preset.types.js";
import { applyPresetDefaults } from "./presets.apply.js";

function preset(
  widgetType: string,
  field: string,
  content: string,
  lang = "en",
): PresetRecord {
  return {
    id: `p_${widgetType}_${field}_${lang}`,
    widget_type: widgetType,
    field,
    lang,
    content,
    label: field,
    field_type: "text",
    maxlength: null,
    sort: 10,
    enabled: true,
    remark: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("applyPresetDefaults", () => {
  it("fills empty fields, skips hidden/dynamic nodes and falls back to the default language", () => {
    const input = [
      { id: "normal", widgetType: "heading", settings: {} },
      {
        id: "hidden",
        widgetType: "heading",
        settings: { hide_desktop: [], title: "" },
      },
      {
        id: "dynamic",
        widgetType: "heading",
        settings: { title: "" },
        __dynamic__: { title: "[elementor-tag]" },
      },
    ];

    const result = applyPresetDefaults(input, {
      lang: "fr",
      defaultLang: "en",
      presets: [preset("heading", "title", "Welcome")],
    });

    expect(result.data[0].settings).toEqual({
      title: "Welcome",
    });
    expect((result.data[1] as { settings: Record<string, unknown> }).settings).toEqual({
      hide_desktop: [],
      title: "",
    });
    expect((result.data[2] as { settings: Record<string, unknown> }).settings).toEqual({
      title: "",
    });
    expect(result.applied).toHaveLength(1);
    expect(result.applied[0]).toMatchObject({
      node_id: "normal",
      lang: "en",
      content: "Welcome",
    });
  });

  it("writes numeric and image values with their runtime types", () => {
    const result = applyPresetDefaults(
      [
        {
          id: "counter",
          widgetType: "counter",
          settings: { ending_number: "" },
        },
        {
          id: "cta",
          widgetType: "call-to-action",
          settings: { bg_image: { id: 123 } },
        },
      ],
      {
        lang: "en",
        defaultLang: "en",
        presets: [
          preset("counter", "ending_number", "100"),
          preset("call-to-action", "bg_image", "/uploads/image.png"),
        ],
      },
    );

    expect((result.data[0].settings as Record<string, unknown>).ending_number).toBe(100);
    expect((result.data[1].settings as Record<string, unknown>).bg_image).toEqual({
      url: "/uploads/image.png",
      id: "",
      size: "",
      alt: "",
      source: "library",
    });
  });

  it("does not apply or report empty built-in defaults", () => {
    const result = applyPresetDefaults(
      [
        {
          id: "cta",
          widgetType: "call-to-action",
          settings: { title: "", description: "", button: "", bg_image: { id: 1 } },
        },
      ],
      { lang: "en", defaultLang: "en", presets: [] },
    );

    expect(result.applied).toEqual([]);
    expect((result.data[0].settings as Record<string, unknown>).bg_image).toEqual({ id: 1 });
  });
});
