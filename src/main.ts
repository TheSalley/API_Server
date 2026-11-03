import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Express, Request, Response } from "express";
import { AppModule } from "./app.module.js";
import { AllExceptionsFilter } from "./common/http/all-exceptions.filter.js";
import { ResponseInterceptor } from "./common/http/response.interceptor.js";
import { AppConfig } from "./config/configuration.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const logger = new Logger("Bootstrap");

  app.enableCors({
    origin: config.get("corsOrigins", { infer: true }),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    maxAge: 86400,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

  const uploadDir = config.get("uploadDir", { infer: true });
  const uploadUrlPrefix = config.get("uploadUrlPrefix", { infer: true });
  app.useStaticAssets(uploadDir, {
    prefix: `${uploadUrlPrefix}/`,
    setHeaders: (response) => {
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("material_collect_system API")
    .setDescription("预设文案、媒体库与 Elementor 数据填充接口")
    .setVersion("1.0.0")
    .addTag("presets", "预设文案")
    .addTag("media", "媒体库")
    .addTag("health", "健康检查")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, { jsonDocumentUrl: "docs-json" });

  app.enableShutdownHooks();
  await app.init();

  const httpServer = app.getHttpAdapter().getInstance() as Express;
  httpServer.use((_request: Request, response: Response) => {
    response.status(404).json({ code: 404, data: null, message: "接口不存在" });
  });

  const port = config.get("port", { infer: true });
  const host = config.get("host", { infer: true });
  await app.listen(port, host);
  logger.log(`NestJS 服务已启动: http://${host}:${port}`);
  logger.log(`Swagger 文档: http://${host}:${port}/docs`);
  logger.log(`调试面板: http://${host}:${port}/panel`);
}

bootstrap().catch((error: unknown) => {
  console.error("[bootstrap] 启动失败:", error);
  process.exit(1);
});
