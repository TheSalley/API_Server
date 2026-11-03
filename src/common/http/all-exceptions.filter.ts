import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const multerError = exception as {
      name?: string;
      code?: string;
    };
    const isMulterError =
      exception !== null &&
      typeof exception === "object" &&
      multerError.name === "MulterError";
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : isMulterError
          ? multerError.code === "LIMIT_FILE_SIZE"
            ? HttpStatus.PAYLOAD_TOO_LARGE
            : HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? "服务器内部错误"
        : "请求处理失败";

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (body && typeof body === "object" && "message" in body) {
        const rawMessage = (body as { message?: string | string[] }).message;
        if (Array.isArray(rawMessage)) message = rawMessage.join("；");
        else if (rawMessage) message = rawMessage;
      }
    } else if (isMulterError) {
      message =
        multerError.code === "LIMIT_FILE_SIZE"
          ? "上传文件过大"
          : "上传请求格式错误";
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.originalUrl} -> ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    if (response.headersSent) return;
    response.status(status).json({ code: status, data: null, message });
  }
}
