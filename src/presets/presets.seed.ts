import { createId, nowIso } from "../common/utils/id.js";
import { fieldMetaOf } from "./widgets.js";
import { PresetRecord } from "./preset.types.js";

function preset({
  widget_type,
  field,
  content,
  sort = 10,
  remark = "",
}: {
  widget_type: string;
  field: string;
  content: string;
  sort?: number;
  remark?: string;
}): PresetRecord {
  const meta = fieldMetaOf(widget_type, field);
  return {
    id: createId("p_"),
    widget_type,
    field,
    lang: "en",
    content,
    label: meta?.label || field,
    field_type: meta?.type || "text",
    maxlength: meta?.maxlength ?? null,
    sort,
    enabled: true,
    remark,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

export function seedPresets(): PresetRecord[] {
  return [
    preset({
      widget_type: "text-editor",
      field: "editor",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
      sort: 10,
      remark: "对应前端 dataExtractor.js 的 DEFAULT_TEXT_EDITOR_HTML",
    }),
    preset({ widget_type: "heading", field: "title", content: "Welcome to our website" }),
    preset({ widget_type: "button", field: "text", content: "Learn More" }),
    preset({ widget_type: "call-to-action", field: "title", content: "Ready to get started?" }),
    preset({
      widget_type: "call-to-action",
      field: "description",
      content: "Join thousands of happy customers. Sign up today and get started in minutes.",
      sort: 20,
    }),
    preset({ widget_type: "call-to-action", field: "button", content: "Get Started", sort: 30 }),
    preset({ widget_type: "icon-box", field: "title_text", content: "High Quality" }),
    preset({
      widget_type: "icon-box",
      field: "description_text",
      content: "We build products that last for years.",
      sort: 20,
    }),
    preset({ widget_type: "counter", field: "title", content: "Happy Clients" }),
    preset({ widget_type: "counter", field: "suffix", content: "+", sort: 20 }),
    preset({ widget_type: "animated-headline", field: "before_text", content: "We craft" }),
    preset({
      widget_type: "animated-headline",
      field: "highlighted_text",
      content: "amazing websites",
      sort: 20,
    }),
    preset({ widget_type: "elementskit-button", field: "ekit_btn_text", content: "Read More" }),
    preset({ widget_type: "jkit_button", field: "sg_content_label", content: "View Details" }),
    preset({
      widget_type: "premium-counter",
      field: "premium_counter_title",
      content: "Years of Experience",
    }),
    preset({
      widget_type: "premium-counter",
      field: "premium_counter_suffix",
      content: "+",
      sort: 20,
    }),
  ];
}
