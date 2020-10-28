import type MessageHandler from "../handler";
import { MessageType } from "../constants";
import { InsteonRequestWrapper } from "../../../model/api/insteon-message";

export interface IDispatcher {
  id: string;
  name: string;

  checkSize(handler: MessageHandler, raw: string): string | boolean;
  handle(
    handler: MessageHandler,
    raw: string,
    request: InsteonRequestWrapper
  ): MessageType;
}
