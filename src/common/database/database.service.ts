import {
  Injectable,
  Logger,
  OnApplicationShutdown,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { AppConfig } from "../../config/configuration.js";
import { nowIso } from "../utils/id.js";

interface Migration {
  version: number;
  sql: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS presets (
        id          TEXT PRIMARY KEY,
        widget_type TEXT NOT NULL,
        field       TEXT NOT NULL,
        lang        TEXT NOT NULL,
        content     TEXT NOT NULL,
        label       TEXT,
        field_type  TEXT,
        maxlength   INTEGER,
        sort        INTEGER NOT NULL DEFAULT 10,
        enabled     INTEGER NOT NULL DEFAULT 1,
        remark      TEXT,
        created_at  TEXT,
        updated_at  TEXT
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_presets_key
        ON presets(widget_type, field, lang);

      CREATE TABLE IF NOT EXISTS media (
        id            TEXT PRIMARY KEY,
        filename      TEXT NOT NULL,
        original_name TEXT,
        mime          TEXT,
        size          INTEGER,
        url           TEXT NOT NULL,
        created_at    TEXT,
        updated_at    TEXT
      );
    `,
  },
];

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly database: DatabaseSync;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    const dbFile = this.config.get("dbFile", { infer: true });
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });

    this.database = new DatabaseSync(dbFile);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
    `);
    this.migrate();
    this.logger.log(`SQLite 数据库: ${dbFile}`);
  }

  get connection(): DatabaseSync {
    return this.database;
  }

  ping(): void {
    this.database.prepare("SELECT 1 AS ok").get();
  }

  onApplicationShutdown(): void {
    try {
      this.database.close();
    } catch (error) {
      this.logger.warn(`关闭 SQLite 失败: ${(error as Error).message}`);
    }
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);

    const applied = new Set(
      (
        this.database
          .prepare("SELECT version FROM schema_migrations")
          .all() as Array<{ version: number }>
      ).map((row) => row.version),
    );

    for (const migration of MIGRATIONS) {
      if (applied.has(migration.version)) continue;
      this.database.exec("BEGIN");
      try {
        this.database.exec(migration.sql);
        this.database
          .prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)")
          .run(migration.version, nowIso());
        this.database.exec("COMMIT");
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    }
  }
}
