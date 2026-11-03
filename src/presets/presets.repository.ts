import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../common/database/database.service.js";
import { nowIso } from "../common/utils/id.js";
import { PresetDbRow, PresetListOptions, PresetRecord } from "./preset.types.js";

const INSERT_COLUMNS = [
  "id",
  "widget_type",
  "field",
  "lang",
  "content",
  "label",
  "field_type",
  "maxlength",
  "sort",
  "enabled",
  "remark",
  "created_at",
  "updated_at",
] as const;

const UPDATE_COLUMNS = [
  "widget_type",
  "field",
  "lang",
  "content",
  "label",
  "field_type",
  "maxlength",
  "sort",
  "enabled",
  "remark",
] as const;

const INSERT_SQL = `
  INSERT INTO presets (${INSERT_COLUMNS.join(", ")})
  VALUES (${INSERT_COLUMNS.map(() => "?").join(", ")})
`;

function mapRow(row: PresetDbRow | undefined): PresetRecord | null {
  if (!row) return null;
  return { ...row, enabled: Boolean(row.enabled) };
}

function bindValues(record: PresetRecord): Array<string | number | null> {
  return [
    record.id,
    record.widget_type,
    record.field,
    record.lang,
    record.content,
    record.label,
    record.field_type,
    record.maxlength,
    record.sort,
    record.enabled ? 1 : 0,
    record.remark,
    record.created_at,
    record.updated_at,
  ];
}

@Injectable()
export class PresetsRepository {
  constructor(private readonly database: DatabaseService) {}

  private get db() {
    return this.database.connection;
  }

  count(): number {
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM presets").get() as { count: number };
    return Number(row.count);
  }

  all(): PresetRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM presets ORDER BY sort ASC, created_at DESC")
      .all() as unknown as PresetDbRow[];
    return rows.map((row) => mapRow(row)!);
  }

  findById(id: string): PresetRecord | null {
    const row = this.db
      .prepare("SELECT * FROM presets WHERE id = ?")
      .get(id) as unknown as PresetDbRow | undefined;
    return mapRow(row);
  }

  findByKey(widgetType: string, field: string, lang: string): PresetRecord | null {
    const row = this.db
      .prepare("SELECT * FROM presets WHERE widget_type = ? AND field = ? AND lang = ?")
      .get(widgetType, field, lang) as unknown as PresetDbRow | undefined;
    return mapRow(row);
  }

  insert(record: PresetRecord): PresetRecord {
    this.db.prepare(INSERT_SQL).run(...bindValues(record));
    return this.findById(record.id)!;
  }

  insertMany(records: PresetRecord[]): void {
    const insert = this.db.prepare(INSERT_SQL);
    this.db.exec("BEGIN");
    try {
      for (const record of records) insert.run(...bindValues(record));
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  updateById(id: string, patch: Partial<PresetRecord>): PresetRecord | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const columns = UPDATE_COLUMNS.filter((column) => patch[column] !== undefined);
    const setClauses = columns.map((column) => `${column} = ?`);
    const values: Array<string | number | null> = columns.map((column) =>
      column === "enabled"
        ? patch.enabled
          ? 1
          : 0
        : (patch[column] as string | number | null),
    );

    setClauses.push("updated_at = ?");
    values.push(nowIso());
    values.push(id);

    this.db.prepare(`UPDATE presets SET ${setClauses.join(", ")} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  removeById(id: string): PresetRecord | null {
    const existing = this.findById(id);
    if (!existing) return null;
    this.db.prepare("DELETE FROM presets WHERE id = ?").run(id);
    return existing;
  }

  list(options: PresetListOptions): { list: PresetRecord[]; total: number } {
    const where: string[] = [];
    const params: Array<string | number> = [];

    if (options.widget_type) {
      where.push("widget_type = ?");
      params.push(options.widget_type);
    }
    if (options.field) {
      where.push("field = ?");
      params.push(options.field);
    }
    if (options.lang) {
      where.push("lang = ?");
      params.push(options.lang);
    }
    if (options.enabled !== undefined && options.enabled !== null) {
      where.push("enabled = ?");
      params.push(options.enabled ? 1 : 0);
    }
    if (options.keyword) {
      where.push(
        "(widget_type LIKE ? OR field LIKE ? OR lang LIKE ? OR content LIKE ? OR label LIKE ? OR remark LIKE ?)",
      );
      const keyword = `%${options.keyword}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const totalRow = this.db
      .prepare(`SELECT COUNT(*) AS count FROM presets ${whereSql}`)
      .get(...params) as { count: number };
    const rows = this.db
      .prepare(
        `SELECT * FROM presets ${whereSql} ORDER BY sort ASC, created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, options.pageSize, (options.page - 1) * options.pageSize) as unknown as PresetDbRow[];

    return { list: rows.map((row) => mapRow(row)!), total: Number(totalRow.count) };
  }
}
