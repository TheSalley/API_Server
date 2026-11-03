export interface PresetRecord {
  id: string;
  widget_type: string;
  field: string;
  lang: string;
  content: string;
  label: string | null;
  field_type: string | null;
  maxlength: number | null;
  sort: number;
  enabled: boolean;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export interface PresetDbRow extends Omit<PresetRecord, "enabled"> {
  enabled: number;
}

export interface PresetListOptions {
  page: number;
  pageSize: number;
  widget_type?: string;
  field?: string;
  lang?: string;
  enabled?: boolean | null;
  keyword?: string;
}

export interface AppliedPreset {
  node_id: string;
  widget_type: string;
  field: string;
  lang: string;
  content: unknown;
  preset_id: string | null;
}
