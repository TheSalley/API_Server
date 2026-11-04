import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined) return undefined;
  return value === true || value === "true" || value === "1" || value === 1;
};

export class PresetTextDto {
  @ApiPropertyOptional({ example: "主标题" })
  @Transform(trimString)
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiProperty({ example: "把复杂留给我们，把简单交给你" })
  @Transform(trimString)
  @IsString()
  @MaxLength(20000)
  content!: string;
}

export class PresetImageDto {
  @ApiPropertyOptional({ example: "主视觉" })
  @Transform(trimString)
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiProperty({ example: "https://example.com/banner.png" })
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  url!: string;
}

export class PresetContentDto {
  @ApiPropertyOptional({ type: [PresetTextDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PresetTextDto)
  @IsOptional()
  texts?: PresetTextDto[];

  @ApiPropertyOptional({ type: [PresetImageDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PresetImageDto)
  @IsOptional()
  images?: PresetImageDto[];
}

export class CreatePresetDto {
  @ApiProperty({ example: "common", description: "行业分类 key" })
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  category!: string;

  @ApiProperty({ example: "通用首页" })
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: "不区分行业的通用首页素材" })
  @Transform(trimString)
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: PresetContentDto,
    description: "内容包 JSON：文本与图片素材",
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PresetContentDto)
  content!: PresetContentDto;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ default: true })
  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ example: "内部备注" })
  @Transform(trimString)
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  remark?: string;
}
