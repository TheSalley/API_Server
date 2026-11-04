import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength } from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreatePresetCategoryDto {
  @ApiPropertyOptional({
    example: "common",
    description: "分类 key，不传时自动生成",
  })
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  @IsOptional()
  key?: string;

  @ApiProperty({ example: "通用" })
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ example: "不区分行业的通用素材" })
  @Transform(trimString)
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sort?: number;
}
