/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
import { InsteonRequestWrapper } from "../../../model/api/insteon-message";
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
    request: InsteonRequestWrapper
  ): MessageType;

  abstract register(map: Map<string, IDispatcher>): void;
}
