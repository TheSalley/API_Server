import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { CreatePresetDto } from "./create-preset.dto.js";

export class UpdatePresetDto extends PartialType(CreatePresetDto) {
  @ApiPropertyOptional({ description: "预设 ID，也可通过 query 传 id" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  @IsOptional()
  id?: string;
}
