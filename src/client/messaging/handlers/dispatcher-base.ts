/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
import DeviceCommandRequest from "../../../model/api/device-command-request";
import { MessageType } from "../constants";
import type MessageHandler from "../handler";
import { IDispatcher } from "./idispatcher";

export default abstract class DispatcherBase implements IDispatcher {
  abstract id: string;

  abstract name: string;

  checkSize(handler: MessageHandler, raw: string): string | boolean {
    if (raw.length < 22) {
      return false;
    }
    handler.buffer = raw.slice(22);
    return raw.slice(0, 22);
  }

  abstract handle(
    handler: MessageHandler,
    raw: string,
    request: DeviceCommandRequest
  ): MessageType;

  abstract register(map: Map<string, IDispatcher>): void;
}
