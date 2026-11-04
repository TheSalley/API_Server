import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { AppModule } from "../src/app.module.js";
import { DatabaseService } from "../src/common/database/database.service.js";
import { AllExceptionsFilter } from "../src/common/http/all-exceptions.filter.js";
import { ResponseInterceptor } from "../src/common/http/response.interceptor.js";

const runtimeDir = path.resolve(process.cwd(), ".e2e-runtime");
process.env.DB_FILE = path.join(runtimeDir, "app.db");
process.env.UPLOAD_DIR = path.join(runtimeDir, "uploads");
process.env.MAX_UPLOAD_SIZE = "2097152";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2ZC8AAAAASUVORK5CYII=",
  "base64",
);

describe("API (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await fs.promises.rm(runtimeDir, { recursive: true, force: true });
  });

  it("returns health and seeded presets", async () => {
    const health = await request(app.getHttpServer()).get("/api/health").expect(200);
    expect(health.body).toMatchObject({
      code: 0,
      data: { status: "ok", database: "ok" },
    });

    const list = await request(app.getHttpServer())
      .get("/api/presets/list")
      .expect(200);
    expect(list.body.code).toBe(0);
    expect(list.body.data.total).toBe(9);
    expect(list.body.data.list[0].content).toHaveProperty("texts");
    expect(list.body.data.list[0].content).toHaveProperty("images");
    const seedImageUrl = list.body.data.list[0].content.images[0].url;
    expect(seedImageUrl).toMatch(/^\/seed\/[a-z0-9-]+\.svg$/);

    const seedImage = await request(app.getHttpServer())
      .get(seedImageUrl)
      .expect(200);
    expect(seedImage.headers["content-type"]).toContain("image/svg+xml");

    const categories = await request(app.getHttpServer())
      .get("/api/presets/categories")
      .expect(200);
    expect(categories.body.data).toHaveLength(5);
    expect(categories.body.data[0]).toMatchObject({ key: "energy", name: "新能源" });
  });

  it("returns real HTTP status codes for validation errors", async () => {
    const invalidAdd = await request(app.getHttpServer())
      .post("/api/presets/add")
      .send({})
      .expect(400);
    expect(invalidAdd.body).toMatchObject({ code: 400, data: null });
  });

  it("creates, updates and deletes a preset content package", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/presets/add")
      .send({
        category: "common",
        name: "E2E 通用包",
        description: "e2e 测试内容包",
        content: {
          texts: [{ title: "主标题", content: "测试文案" }],
          images: [{ name: "主视觉", url: "https://example.com/e2e.png" }],
        },
      })
      .expect(200);

    expect(created.body.data).toMatchObject({
      category: "common",
      category_name: "通用",
      name: "E2E 通用包",
      content: {
        texts: [{ title: "主标题", content: "测试文案" }],
        images: [{ name: "主视觉", url: "https://example.com/e2e.png" }],
      },
    });
    const id = created.body.data.id;

    const stored = app
      .get(DatabaseService)
      .connection.prepare("SELECT content FROM presets WHERE id = ?")
      .get(id) as { content: string };
    expect(JSON.parse(stored.content).images[0].url).toBe(
      "https://example.com/e2e.png",
    );

    const list = await request(app.getHttpServer())
      .get("/api/presets/list")
      .query({ keyword: "E2E" })
      .expect(200);
    expect(list.body.data.total).toBe(1);
    expect(list.body.data.list[0].id).toBe(id);

    const updated = await request(app.getHttpServer())
      .post("/api/presets/update")
      .send({
        id,
        content: {
          texts: [{ title: "更新", content: "更新后的文案" }],
          images: [],
        },
      })
      .expect(200);
    expect(updated.body.data.content.texts[0].content).toBe("更新后的文案");

    await request(app.getHttpServer())
      .post("/api/presets/delete")
      .send({ id })
      .expect(200);
  });

  it("creates preset categories and prevents deleting a category in use", async () => {
    const category = await request(app.getHttpServer())
      .post("/api/presets/categories/add")
      .send({ key: "e2e", name: "E2E 分类", description: "测试分类" })
      .expect(200);
    expect(category.body.data).toMatchObject({ key: "e2e", name: "E2E 分类" });

    const preset = await request(app.getHttpServer())
      .post("/api/presets/add")
      .send({
        category: "e2e",
        name: "分类占用包",
        content: { texts: [{ title: "标题", content: "内容" }] },
      })
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/presets/categories/delete")
      .send({ key: "e2e" })
      .expect(400);

    await request(app.getHttpServer())
      .post("/api/presets/delete")
      .send({ id: preset.body.data.id })
      .expect(200);
    await request(app.getHttpServer())
      .post("/api/presets/categories/delete")
      .send({ key: "e2e" })
      .expect(200);
  });

  it("uploads, serves and deletes a verified image", async () => {
    const upload = await request(app.getHttpServer())
      .post("/api/media/upload")
      .attach("file", png, { filename: "pixel.png", contentType: "image/png" })
      .expect(200);

    expect(upload.body.data).toMatchObject({
      mime: "image/png",
      size: png.length,
    });
    const id = upload.body.data.id;

    const detail = await request(app.getHttpServer())
      .get(`/api/media/${id}`)
      .expect(200);
    expect(detail.body.data.id).toBe(id);

    await request(app.getHttpServer())
      .post("/api/media/upload")
      .attach("file", Buffer.from("not an image"), {
        filename: "fake.png",
        contentType: "image/png",
      })
      .expect(400);

    await request(app.getHttpServer()).delete(`/api/media/${id}`).expect(200);
  });
});
