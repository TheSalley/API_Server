import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ResponseMessage } from "../common/http/api-response.js";
import { ListMediaQueryDto } from "./dto/list-media-query.dto.js";
import { MediaService } from "./media.service.js";

@ApiTags("media")
@Controller("api/media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload")
  @HttpCode(200)
  @ResponseMessage("上传成功")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "上传图片" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  upload(@UploadedFile() file?: Express.Multer.File) {
    return this.mediaService.upload(file);
  }

  @Get("list")
  @ApiOperation({ summary: "媒体列表" })
  list(@Query() query: ListMediaQueryDto) {
    return this.mediaService.list(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "媒体详情" })
  findById(@Param("id") id: string) {
    return this.mediaService.findById(id);
  }

  @Delete(":id")
  @HttpCode(200)
  @ResponseMessage("删除成功")
  @ApiOperation({ summary: "删除媒体" })
  remove(@Param("id") id: string) {
    return this.mediaService.remove(id);
  }
}
