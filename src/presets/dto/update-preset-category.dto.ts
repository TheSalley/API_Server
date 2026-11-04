import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength } from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class UpdatePresetCategoryDto {
  @ApiProperty({ description: "要更新的分类 key，也可通过 query 传 key" })
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  @IsOptional()
  key?: string;

  @ApiPropertyOptional({ example: "通用" })
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sort?: number;
}
