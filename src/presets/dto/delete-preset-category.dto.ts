import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class DeletePresetCategoryDto {
  @ApiPropertyOptional({ description: "分类 key，也可通过 query 传 key" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(50)
  @IsOptional()
  key?: string;
}
