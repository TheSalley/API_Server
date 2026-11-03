import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { AppModule } from "../src/app.module.js";
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
    expect(list.body.data.total).toBe(16);
  });

  it("returns real HTTP status codes for validation errors", async () => {
    const invalidAdd = await request(app.getHttpServer())
      .post("/api/presets/add")
      .send({})
      .expect(400);
    expect(invalidAdd.body).toMatchObject({ code: 400, data: null });

    const emptyApply = await request(app.getHttpServer())
      .post("/api/presets/apply")
      .send({ elementor_data: [] })
      .expect(400);
    expect(emptyApply.body).toMatchObject({ code: 400, data: null });
  });

  it("applies presets without mutating hidden or dynamic nodes", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/presets/apply")
      .send({
        elementor_data: [
          { id: "normal", widgetType: "heading", settings: {} },
          {
            id: "hidden",
            widgetType: "heading",
            settings: { hide_desktop: [], title: "" },
          },
          {
            id: "dynamic",
            widgetType: "heading",
            settings: { title: "" },
            __dynamic__: { title: "[elementor-tag]" },
          },
        ],
      })
      .expect(200);

    expect(response.body.data.data[0].settings.title).toBe("Welcome to our website");
    expect(response.body.data.data[1].settings.title).toBe("");
    expect(response.body.data.data[2].settings.title).toBe("");
    expect(response.body.data.applied).toHaveLength(1);
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
