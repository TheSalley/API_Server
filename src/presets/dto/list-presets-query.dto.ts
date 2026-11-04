import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto.js";

export class ListPresetsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "行业分类 key" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(50)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: "1/true 或 0/false" })
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    return value === true || value === "true" || value === "1";
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
