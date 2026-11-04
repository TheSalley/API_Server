import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../common/database/database.service.js";
import { nowIso } from "../common/utils/id.js";
import {
  PresetCategoryRecord,
  PresetDbRow,
  PresetListOptions,
  PresetRecord,
} from "./preset.types.js";

const INSERT_COLUMNS = [
  "id",
  "category",
  "name",
  "description",
  "content",
  "sort",
  "enabled",
  "remark",
  "created_at",
  "updated_at",
] as const;

const UPDATE_COLUMNS = [
  "category",
  "name",
  "description",
  "content",
  "sort",
  "enabled",
  "remark",
] as const;

const CATEGORY_INSERT_COLUMNS = [
  "key",
  "name",
  "description",
  "sort",
  "created_at",
  "updated_at",
] as const;

const INSERT_SQL = `
  INSERT INTO presets (${INSERT_COLUMNS.join(", ")})
  VALUES (${INSERT_COLUMNS.map(() => "?").join(", ")})
`;

const SELECT_SQL = `
  SELECT p.*, c.name AS category_name
  FROM presets p
  LEFT JOIN preset_categories c ON c.key = p.category
`;

function mapRow(row: PresetDbRow | undefined): PresetRecord | null {
  if (!row) return null;
  return { ...row, enabled: Boolean(row.enabled) };
}

function bindValues(record: PresetRecord): Array<string | number | null> {
  return [
    record.id,
    record.category,
    record.name,
    record.description,
    record.content,
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

  findById(id: string): PresetRecord | null {
    const row = this.db
      .prepare(`${SELECT_SQL} WHERE p.id = ?`)
      .get(id) as unknown as PresetDbRow | undefined;
    return mapRow(row);
  }

  findByKey(category: string, name: string): PresetRecord | null {
    const row = this.db
      .prepare(`${SELECT_SQL} WHERE p.category = ? AND p.name = ?`)
      .get(category, name) as unknown as PresetDbRow | undefined;
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

    if (options.category) {
      where.push("p.category = ?");
      params.push(options.category);
    }
    if (options.enabled !== undefined && options.enabled !== null) {
      where.push("p.enabled = ?");
      params.push(options.enabled ? 1 : 0);
    }
    if (options.keyword) {
      where.push(
        "(p.category LIKE ? OR p.name LIKE ? OR p.description LIKE ? OR p.content LIKE ? OR p.remark LIKE ? OR c.name LIKE ?)",
      );
      const keyword = `%${options.keyword}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const totalRow = this.db
      .prepare(
        `SELECT COUNT(*) AS count FROM presets p LEFT JOIN preset_categories c ON c.key = p.category ${whereSql}`,
      )
      .get(...params) as { count: number };
    const rows = this.db
      .prepare(
        `${SELECT_SQL} ${whereSql} ORDER BY p.sort ASC, p.created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, options.pageSize, (options.page - 1) * options.pageSize) as unknown as PresetDbRow[];

    return { list: rows.map((row) => mapRow(row)!), total: Number(totalRow.count) };
  }

  countCategories(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM preset_categories")
      .get() as { count: number };
    return Number(row.count);
  }

  allCategories(): PresetCategoryRecord[] {
    return this.db
      .prepare(
        "SELECT key, name, description, sort, created_at, updated_at FROM preset_categories ORDER BY sort ASC, created_at ASC",
      )
      .all() as unknown as PresetCategoryRecord[];
  }

  findCategoryByKey(key: string): PresetCategoryRecord | null {
    const row = this.db
      .prepare(
        "SELECT key, name, description, sort, created_at, updated_at FROM preset_categories WHERE key = ?",
      )
      .get(key) as unknown as PresetCategoryRecord | undefined;
    return row ?? null;
  }

  findCategoryByName(name: string): PresetCategoryRecord | null {
    const row = this.db
      .prepare(
        "SELECT key, name, description, sort, created_at, updated_at FROM preset_categories WHERE name = ?",
      )
      .get(name) as unknown as PresetCategoryRecord | undefined;
    return row ?? null;
  }

  countByCategory(category: string): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM presets WHERE category = ?")
      .get(category) as { count: number };
    return Number(row.count);
  }

  insertCategory(record: PresetCategoryRecord): PresetCategoryRecord {
    this.db
      .prepare(
        `INSERT INTO preset_categories (${CATEGORY_INSERT_COLUMNS.join(", ")})
         VALUES (${CATEGORY_INSERT_COLUMNS.map(() => "?").join(", ")})`,
      )
      .run(
        record.key,
        record.name,
        record.description,
        record.sort,
        record.created_at,
        record.updated_at,
      );
    return this.findCategoryByKey(record.key)!;
  }

  insertCategories(records: PresetCategoryRecord[]): void {
    const insert = this.db.prepare(
      `INSERT INTO preset_categories (${CATEGORY_INSERT_COLUMNS.join(", ")})
       VALUES (${CATEGORY_INSERT_COLUMNS.map(() => "?").join(", ")})`,
    );
    this.db.exec("BEGIN");
    try {
      for (const record of records) {
        insert.run(
          record.key,
          record.name,
          record.description,
          record.sort,
          record.created_at,
          record.updated_at,
        );
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  updateCategory(
    key: string,
    patch: Partial<Pick<PresetCategoryRecord, "name" | "description" | "sort">>,
  ): PresetCategoryRecord | null {
    const existing = this.findCategoryByKey(key);
    if (!existing) return null;

    const columns = (["name", "description", "sort"] as const).filter(
      (column) => patch[column] !== undefined,
    );
    if (columns.length > 0) {
      const setClauses = columns.map((column) => `${column} = ?`);
      const values: Array<string | number | null> = columns.map(
        (column) => patch[column] as string | number | null,
      );
      setClauses.push("updated_at = ?");
      values.push(nowIso());
      values.push(key);
      this.db
        .prepare(`UPDATE preset_categories SET ${setClauses.join(", ")} WHERE key = ?`)
        .run(...values);
    }

    return this.findCategoryByKey(key);
  }

  removeCategory(key: string): PresetCategoryRecord | null {
    const existing = this.findCategoryByKey(key);
    if (!existing) return null;
    this.db.prepare("DELETE FROM preset_categories WHERE key = ?").run(key);
    return existing;
  }
}
