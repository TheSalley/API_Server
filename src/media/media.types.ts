export interface MediaRecord {
  id: string;
  filename: string;
  original_name: string | null;
  mime: string | null;
  size: number;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface MediaDbRow {
  id: string;
  filename: string;
  original_name: string | null;
  mime: string | null;
  size: number | null;
  url: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface MediaListOptions {
  page: number;
  pageSize: number;
  keyword?: string;
}
