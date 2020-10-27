import type MessageHandler from "../handler";
import { MessageType } from "../constants";
import DeviceCommandRequest from "../../../model/api/device-command-request";

export interface IDispatcher {
  id: string;
  name: string;

  checkSize(handler: MessageHandler, raw: string): string | boolean;
  handle(
    handler: MessageHandler,
    raw: string,
    request: DeviceCommandRequest
  ): MessageType;
}
