import { Module } from "@nestjs/common";
import { PresetsController } from "./presets.controller.js";
import { PresetsRepository } from "./presets.repository.js";
import { PresetsService } from "./presets.service.js";

@Module({
  controllers: [PresetsController],
  providers: [PresetsRepository, PresetsService],
  exports: [PresetsService],
})
export class PresetsModule {}
