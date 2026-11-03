import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "../common/http/api-response.js";
import { ApplyPresetsDto } from "./dto/apply-presets.dto.js";
import { CreatePresetDto } from "./dto/create-preset.dto.js";
import { DeletePresetDto } from "./dto/delete-preset.dto.js";
import { ListPresetsQueryDto } from "./dto/list-presets-query.dto.js";
import { UpdatePresetDto } from "./dto/update-preset.dto.js";
import { PresetsService } from "./presets.service.js";

@ApiTags("presets")
@Controller("api/presets")
export class PresetsController {
  constructor(private readonly presetsService: PresetsService) {}

  @Get("list")
  @ApiOperation({ summary: "预设文案列表" })
  list(@Query() query: ListPresetsQueryDto) {
    return this.presetsService.list(query);
  }

  @Post("add")
  @HttpCode(200)
  @ResponseMessage("创建成功")
  @ApiOperation({ summary: "新建预设文案" })
  create(@Body() dto: CreatePresetDto) {
    return this.presetsService.create(dto);
  }

  @Post("update")
  @HttpCode(200)
  @ResponseMessage("更新成功")
  @ApiOperation({ summary: "更新预设文案" })
  update(@Body() dto: UpdatePresetDto, @Query("id") queryId?: string) {
    return this.presetsService.update(dto.id ?? queryId, dto);
  }

  @Post("delete")
  @HttpCode(200)
  @ResponseMessage("删除成功")
  @ApiOperation({ summary: "删除预设文案" })
  remove(@Body() dto: DeletePresetDto, @Query("id") queryId?: string) {
    return this.presetsService.remove(dto?.id ?? queryId);
  }

  @Post("apply")
  @HttpCode(200)
  @ResponseMessage("应用完成")
  @ApiOperation({ summary: "将预设应用到 Elementor 数据" })
  apply(@Body() dto: ApplyPresetsDto) {
    return this.presetsService.apply(dto);
  }
}
