import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../common/database/database.service.js";
import { MediaDbRow, MediaListOptions, MediaRecord } from "./media.types.js";

const INSERT_SQL = `
  INSERT INTO media
    (id, filename, original_name, mime, size, url, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

function mapRow(row: MediaDbRow | undefined): MediaRecord | null {
  if (!row) return null;
  return {
    ...row,
    size: Number(row.size ?? 0),
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
  };
}

@Injectable()
export class MediaRepository {
  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.connection;
  }

  findById(id: string): MediaRecord | null {
    const row = this.db
      .prepare("SELECT * FROM media WHERE id = ?")
      .get(id) as unknown as MediaDbRow | undefined;
    return mapRow(row);
  }

  insert(record: MediaRecord): MediaRecord {
    this.db
      .prepare(INSERT_SQL)
      .run(
        record.id,
        record.filename,
        record.original_name,
        record.mime,
        record.size,
        record.url,
        record.created_at,
        record.updated_at,
      );
    return this.findById(record.id)!;
  }

  countPresetReferences(url: string): number {
    // 预设内容以 JSON 保存，图片地址写在 content.images[].url 中
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM presets WHERE content LIKE ?")
      .get(`%\"url\":\"${url}\"%`) as { count: number };
    return Number(row.count);
  }

  removeById(id: string): MediaRecord | null {
    const existing = this.findById(id);
    if (!existing) return null;
    this.db.prepare("DELETE FROM media WHERE id = ?").run(id);
    return existing;
  }

  list(options: MediaListOptions): { list: MediaRecord[]; total: number } {
    const where: string[] = [];
    const params: string[] = [];

    if (options.keyword) {
      where.push("(original_name LIKE ? OR filename LIKE ?)");
      const keyword = `%${options.keyword}%`;
      params.push(keyword, keyword);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const totalRow = this.db
      .prepare(`SELECT COUNT(*) AS count FROM media ${whereSql}`)
      .get(...params) as { count: number };
    const rows = this.db
      .prepare(
        `SELECT * FROM media ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(
        ...params,
        options.pageSize,
        (options.page - 1) * options.pageSize,
      ) as unknown as MediaDbRow[];

    return { list: rows.map((row) => mapRow(row)!), total: Number(totalRow.count) };
  }
}
