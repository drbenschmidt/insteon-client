/* eslint-disable no-bitwise */
/* eslint-disable no-param-reassign */
import type MessageHandler from "../handler";
import { IDispatcher } from "./idispatcher";
import DispatcherBase from "./dispatcher-base";
import { MessageType } from "../constants";
import DeviceCommandRequest from "../../../model/api/device-command-request";

const { parseInt } = Number;
const { max } = Math;

export default class Dispatcher extends DispatcherBase {
  id = "0262";

  name = "Direct Command Response";

  register(map: Map<string, IDispatcher>): void {
    map.set(this.id, this);
  }

  // eslint-disable-next-line class-methods-use-this
  checkSize(handler: MessageHandler, raw: string): string | boolean {
    // Under 12 characters, we don't have the flags byte, so we need more.
    if (raw.length < 12) {
      return false;
    }

    // The interesting thing about an 0262 is it's a variable length response.
    // So unlike the other responses, we need to get to the message flags byte to know
    // whether it's a standard (18 hex chars) or extended (46 hex chars) response.
    const flags = parseInt(raw.slice(10, 12), 16);
    const isExtended = (flags & 0x10) !== 0;
    const expectedLength = isExtended ? 46 : 18;

    if (raw.length < expectedLength) {
      return false;
    }

    handler.buffer = raw.slice(expectedLength);

    return raw.slice(0, max(0, expectedLength));
  }

  // eslint-disable-next-line class-methods-use-this
  handle(
    handler: MessageHandler,
    raw: string,
    request: DeviceCommandRequest
  ): MessageType {
    if (!handler.currentRequest) {
      return MessageType.SKIPPED;
    }

    /* this.emit('recvCommand', {
      type: '62',
      raw: raw.substr(0, status.command.raw.length + 2)
    }); */

    const { raw: requestRaw } = request.command;

    request.ack =
      raw.slice(requestRaw?.length, requestRaw?.length + 2) === "06";
    request.nack =
      raw.slice(requestRaw?.length, requestRaw?.length + 2) === "15";

    return MessageType.PROCESSED;
  }
}
