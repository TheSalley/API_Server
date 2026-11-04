import { Module } from "@nestjs/common";
import { PresetsController } from "./presets.controller.js";
import { PresetsRepository } from "./presets.repository.js";
import { PresetsService } from "./presets.service.js";
import { SeedImagesController } from "./seed-images.controller.js";

@Module({
  controllers: [PresetsController, SeedImagesController],
  providers: [PresetsRepository, PresetsService],
  exports: [PresetsService],
})
export class PresetsModule {}
