import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../common/database/database.service.js";
import { nowIso } from "../common/utils/id.js";

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseService) {}

  check() {
    this.database.ping();
    return { status: "ok", database: "ok", ts: nowIso() };
  }
}
