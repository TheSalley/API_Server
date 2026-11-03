import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import { AppConfig } from "../config/configuration.js";
import { MediaController } from "./media.controller.js";
import { MediaRepository } from "./media.repository.js";
import { MediaService } from "./media.service.js";

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        limits: {
          fileSize: config.get("maxUploadSize", { infer: true }),
          files: 1,
        },
      }),
    }),
  ],
  controllers: [MediaController],
  providers: [MediaRepository, MediaService],
  exports: [MediaService],
})
export class MediaModule {}
