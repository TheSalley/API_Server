import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "../common/http/api-response.js";
import { CreatePresetCategoryDto } from "./dto/create-preset-category.dto.js";
import { CreatePresetDto } from "./dto/create-preset.dto.js";
import { DeletePresetCategoryDto } from "./dto/delete-preset-category.dto.js";
import { DeletePresetDto } from "./dto/delete-preset.dto.js";
import { ListPresetsQueryDto } from "./dto/list-presets-query.dto.js";
import { UpdatePresetCategoryDto } from "./dto/update-preset-category.dto.js";
import { UpdatePresetDto } from "./dto/update-preset.dto.js";
import { SyncImagebaseDto } from "./dto/sync-imagebase.dto.js";
import { ImagebaseSyncService } from "./imagebase-sync.service.js";
import { PresetsService } from "./presets.service.js";

@ApiTags("presets")
@Controller("api/presets")
export class PresetsController {
  constructor(
    private readonly presetsService: PresetsService,
    private readonly imagebaseSyncService: ImagebaseSyncService,
  ) {}

  @Post("sync/imagebase")
  @HttpCode(200)
  @ResponseMessage("同步成功")
  @ApiOperation({ summary: "从 ImageBase 同步分组与图片素材" })
  syncImagebase(@Body() dto: SyncImagebaseDto) {
    return this.imagebaseSyncService.sync({ groups: dto?.groups });
  }

  @Get("list")
  @ApiOperation({ summary: "预设内容包列表" })
  list(@Query() query: ListPresetsQueryDto) {
    return this.presetsService.list(query);
  }

  @Post("add")
  @HttpCode(200)
  @ResponseMessage("创建成功")
  @ApiOperation({ summary: "新建预设内容包" })
  create(@Body() dto: CreatePresetDto) {
    return this.presetsService.create(dto);
  }

  @Post("update")
  @HttpCode(200)
  @ResponseMessage("更新成功")
  @ApiOperation({ summary: "更新预设内容包" })
  update(@Body() dto: UpdatePresetDto, @Query("id") queryId?: string) {
    return this.presetsService.update(dto.id ?? queryId, dto);
  }

  @Post("delete")
  @HttpCode(200)
  @ResponseMessage("删除成功")
  @ApiOperation({ summary: "删除预设内容包" })
  remove(@Body() dto: DeletePresetDto, @Query("id") queryId?: string) {
    return this.presetsService.remove(dto?.id ?? queryId);
  }

  @Get("categories")
  @ApiOperation({ summary: "预设分类列表" })
  listCategories() {
    return this.presetsService.listCategories();
  }

  @Post("categories/add")
  @HttpCode(200)
  @ResponseMessage("创建成功")
  @ApiOperation({ summary: "新建预设分类" })
  createCategory(@Body() dto: CreatePresetCategoryDto) {
    return this.presetsService.createCategory(dto);
  }

  @Post("categories/update")
  @HttpCode(200)
  @ResponseMessage("更新成功")
  @ApiOperation({ summary: "更新预设分类" })
  updateCategory(@Body() dto: UpdatePresetCategoryDto, @Query("key") queryKey?: string) {
    return this.presetsService.updateCategory(dto.key ?? queryKey, dto);
  }

  @Post("categories/delete")
  @HttpCode(200)
  @ResponseMessage("删除成功")
  @ApiOperation({ summary: "删除预设分类" })
  removeCategory(
    @Body() dto: DeletePresetCategoryDto,
    @Query("key") queryKey?: string,
  ) {
    return this.presetsService.removeCategory(dto?.key ?? queryKey);
  }
}
