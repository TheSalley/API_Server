import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class ApplyPresetsDto {
  @ApiProperty({
    type: "array",
    description: "Elementor 顶层数组",
    items: { type: "object", additionalProperties: true },
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsObject({ each: true })
  elementor_data!: Record<string, unknown>[];

  @ApiPropertyOptional({ example: "en" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(20)
  @IsOptional()
  lang?: string;
}
