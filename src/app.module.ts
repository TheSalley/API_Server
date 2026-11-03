import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { configuration } from "./config/configuration.js";
import { DatabaseModule } from "./common/database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { MediaModule } from "./media/media.module.js";
import { PanelController } from "./panel/panel.controller.js";
import { PresetsModule } from "./presets/presets.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env.local", ".env"],
      load: [configuration],
    }),
    DatabaseModule,
    PresetsModule,
    MediaModule,
    HealthModule,
  ],
  controllers: [PanelController],
})
export class AppModule {}
