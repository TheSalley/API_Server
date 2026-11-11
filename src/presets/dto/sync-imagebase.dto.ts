import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, Min } from "class-validator";

export class SyncImagebaseDto {
  @ApiPropertyOptional({
    type: [Number],
    example: [13, 15],
    description: "只同步指定分组 ID；不传则同步全部分组",
  })
  @Transform(({ value }) =>
    value === undefined || value === null || value === ""
      ? undefined
      : Array.isArray(value)
        ? value
        : [value],
  )
  @Type(() => Number)
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @IsOptional()
  groups?: number[];
}
