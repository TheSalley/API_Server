import { AppliedPreset, PresetRecord } from "./preset.types.js";
import { presetableFieldsOf } from "./widgets.js";

const BUILTIN_DEFAULTS: Record<string, Record<string, unknown>> = {
  "text-editor": {
    editor:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
  },
  counter: { ending_number: 100 },
  "call-to-action": {
    title: "",
    description: "",
    button: "",
    bg_image: { url: "", id: "", size: "", alt: "", source: "library" },
  },
};

interface ApplyOptions {
  lang: string;
  defaultLang: string;
  presets: PresetRecord[];
}

function hasRealDynamic(value: unknown): boolean {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

function shouldSkipNode(node: any): boolean {
  if (node.settings && Object.prototype.hasOwnProperty.call(node.settings, "hide_desktop")) {
    return true;
  }
  return hasRealDynamic(node.__dynamic__) || hasRealDynamic(node.settings?.__dynamic__);
}

function isEmptyValue(value: unknown, type: string): boolean {
  if (value === undefined || value === null) return true;
  if (type === "image") {
    if (typeof value === "string") return value.trim() === "";
    if (typeof value === "object" && !Array.isArray(value)) {
      const url = (value as { url?: unknown }).url;
      return url === undefined || url === null || String(url).trim() === "";
    }
    return false;
  }
  return typeof value === "string" ? value.trim() === "" : false;
}

function cloneValue<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

export function applyPresetDefaults(
  elementorData: Record<string, unknown>[],
  options: ApplyOptions,
): { data: Record<string, unknown>[]; applied: AppliedPreset[] } {
  const exact = new Map<string, PresetRecord>();
  const defaults = new Map<string, PresetRecord>();

  for (const preset of options.presets) {
    const baseKey = `${preset.widget_type}::${preset.field}`;
    exact.set(`${baseKey}::${preset.lang}`, preset);
    if (preset.lang === options.defaultLang && !defaults.has(baseKey)) {
      defaults.set(baseKey, preset);
    }
  }

  const data = cloneValue(elementorData) as Record<string, unknown>[];
  const applied: AppliedPreset[] = [];

  const walk = (node: any): void => {
    if (!node || typeof node !== "object" || shouldSkipNode(node)) return;
    if (Array.isArray(node.settings)) node.settings = {};

    if (
      node.id &&
      node.widgetType &&
      node.settings &&
      typeof node.settings === "object" &&
      !Array.isArray(node.settings)
    ) {
      for (const field of presetableFieldsOf(node.widgetType)) {
        const key = field.key;
        const type = field.type;
        if (!isEmptyValue(node.settings[key], type)) continue;

        const baseKey = `${node.widgetType}::${key}`;
        const preset = exact.get(`${baseKey}::${options.lang}`) ?? defaults.get(baseKey);

        if (preset) {
          if (type === "number") {
            const number = Number(preset.content);
            if (!Number.isFinite(number)) continue;
            node.settings[key] = number;
          } else if (type === "image") {
            node.settings[key] = {
              url: String(preset.content),
              id: "",
              size: "",
              alt: "",
              source: "library",
            };
          } else {
            node.settings[key] = preset.content;
          }

          applied.push({
            node_id: String(node.id),
            widget_type: node.widgetType,
            field: key,
            lang: preset.lang,
            content: preset.content,
            preset_id: preset.id,
          });
          continue;
        }

        const builtin = BUILTIN_DEFAULTS[node.widgetType]?.[key];
        if (builtin === undefined || isEmptyValue(builtin, type)) continue;
        node.settings[key] = cloneValue(builtin);
        applied.push({
          node_id: String(node.id),
          widget_type: node.widgetType,
          field: key,
          lang: "builtin",
          content: builtin,
          preset_id: null,
        });
      }
    }

    if (Array.isArray(node.elements)) {
      for (const child of node.elements) walk(child);
    }
  };

  for (const part of data) walk(part);
  return { data, applied };
}
