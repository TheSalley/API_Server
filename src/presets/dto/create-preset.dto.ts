import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export const PRESET_FIELD_TYPES = [
  "text",
  "textarea",
  "rich",
  "number",
  "image",
];

const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined) return undefined;
  return value === true || value === "true" || value === "1" || value === 1;
};

export class CreatePresetDto {
  @ApiProperty({ example: "button" })
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  widget_type!: string;

  @ApiProperty({ example: "text" })
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  field!: string;

  @ApiProperty({ example: "Learn More" })
  @Transform(({ value }) =>
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : value,
  )
  @IsString()
  content!: string;

  @ApiPropertyOptional({ example: "en" })
  @Transform(trimString)
  @IsString()
  @MaxLength(20)
  @IsOptional()
  lang?: string;

  @ApiPropertyOptional({ example: "按钮文案" })
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ enum: PRESET_FIELD_TYPES })
  @IsIn(PRESET_FIELD_TYPES)
  @IsOptional()
  field_type?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  maxlength?: number;

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

  @ApiPropertyOptional({ example: "说明" })
  @Transform(trimString)
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  remark?: string;
}
