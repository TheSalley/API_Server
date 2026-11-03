import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "@jest/globals";
import { Readable } from "node:stream";
import { detectImageType, validateImageUpload } from "./media-file.util.js";

function uploadFile(
  buffer: Buffer,
  originalname = "image.png",
  mimetype = "image/png",
): Express.Multer.File {
  return {
    fieldname: "file",
    originalname,
    encoding: "7bit",
    mimetype,
    size: buffer.length,
    buffer,
    stream: Readable.from(buffer),
    destination: "",
    filename: "",
    path: "",
  };
}

describe("media file validation", () => {
  it.each([
    ["JPEG", Buffer.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg"],
    [
      "PNG",
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "image/png",
    ],
    ["GIF", Buffer.from("GIF89a"), "image/gif"],
    ["WEBP", Buffer.from("RIFF0000WEBP"), "image/webp"],
    ["BMP", Buffer.from("BM0000"), "image/bmp"],
    ["AVIF", Buffer.from("0000ftypavif"), "image/avif"],
    ["SVG", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), "image/svg+xml"],
  ])("detects %s from file content", (_name, buffer, expectedMime) => {
    expect(detectImageType(buffer)?.mime).toBe(expectedMime);
  });

  it("accepts a matching extension and MIME type", () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(validateImageUpload(uploadFile(png), ["jpg", "png"])?.mime).toBe(
      "image/png",
    );
  });

  it("rejects extension/content mismatches", () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(() =>
      validateImageUpload(uploadFile(png, "image.jpg", "image/jpeg"), [
        "jpg",
        "png",
      ]),
    ).toThrow(BadRequestException);
  });

  it("rejects declared MIME/content mismatches", () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(() =>
      validateImageUpload(uploadFile(png, "image.png", "image/jpeg"), [
        "jpg",
        "png",
      ]),
    ).toThrow(BadRequestException);
  });

  it("rejects SVG unless it is explicitly allowlisted", () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(() =>
      validateImageUpload(uploadFile(svg, "image.svg", "image/svg+xml"), [
        "jpg",
        "png",
      ]),
    ).toThrow(BadRequestException);
  });
});
