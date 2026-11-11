import { Module } from "@nestjs/common";
import { ImagebaseClient } from "./imagebase.client.js";
import { ImagebaseSyncService } from "./imagebase-sync.service.js";
import { PresetsController } from "./presets.controller.js";
import { PresetsRepository } from "./presets.repository.js";
import { PresetsService } from "./presets.service.js";
import { SeedImagesController } from "./seed-images.controller.js";

@Module({
  controllers: [PresetsController, SeedImagesController],
  providers: [PresetsRepository, PresetsService, ImagebaseClient, ImagebaseSyncService],
  exports: [PresetsService],
})
export class PresetsModule {}
