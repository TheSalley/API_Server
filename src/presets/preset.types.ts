export interface PresetText {
  title: string;
  content: string;
}

export interface PresetImage {
  name: string;
  url: string;
}

export interface PresetContent {
  texts: PresetText[];
  images: PresetImage[];
}

export interface PresetRecord {
  id: string;
  category: string;
  category_name: string | null;
  name: string;
  description: string | null;
  content: string;
  sort: number;
  enabled: boolean;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export interface PresetDbRow extends Omit<PresetRecord, "enabled"> {
  enabled: number;
}

export interface PresetView extends Omit<PresetRecord, "content"> {
  content: PresetContent;
}

export interface PresetListOptions {
  page: number;
  pageSize: number;
  category?: string;
  enabled?: boolean | null;
  keyword?: string;
}

export interface PresetCategoryRecord {
  key: string;
  name: string;
  description: string | null;
  sort: number;
  created_at: string;
  updated_at: string;
}
