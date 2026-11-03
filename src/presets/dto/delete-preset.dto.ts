import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class DeletePresetDto {
  @ApiPropertyOptional({ description: "预设 ID，也可通过 query 传 id" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  @IsOptional()
  id?: string;
}
