import { SetMetadata } from "@nestjs/common";

export interface ApiResponse<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}

export const RESPONSE_MESSAGE_KEY = "__response_message__";

export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
