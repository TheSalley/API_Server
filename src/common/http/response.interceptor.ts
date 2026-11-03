import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiResponse, RESPONSE_MESSAGE_KEY } from "./api-response.js";

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? "success";

    return next.handle().pipe(
      map((data) => {
        if (this.isApiResponse(data)) return data;
        return { code: 0, data: (data ?? null) as T, message };
      }),
    );
  }

  private isApiResponse(value: unknown): value is ApiResponse<T> {
    return (
      typeof value === "object" &&
      value !== null &&
      "code" in value &&
      "data" in value &&
      "message" in value
    );
  }
}
