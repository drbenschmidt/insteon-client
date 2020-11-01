/* eslint-disable class-methods-use-this */
import type MessageHandler from "../handler";
import { IDispatcher } from "./idispatcher";
import DispatcherBase from "./dispatcher-base";
import parseMessageReceived from "../utils";
import { MessageType } from "../constants";
import { InsteonRequestWrapper } from "../../../model/api/insteon-message";
import { genCrc } from "../../../model/util";

export default class Dispatcher extends DispatcherBase {
  id = "0251";

  name = "Extended Command";

  size = 50;

  register(map: Map<string, IDispatcher>): void {
    map.set(this.id, this);
  }

  handle(
    handler: MessageHandler,
    raw: string,
    request: InsteonRequestWrapper
  ): MessageType {
    const message = parseMessageReceived(raw);

    // Calculate if CRC is valid (not use by most commands)
    const fullCmd =
      message.command1 +
      message.command2 +
      message.userData.slice(0, 12).join("");

    const rspCrc = message.userData.slice(12).join("").toLowerCase();
    const crc = genCrc(fullCmd).toLowerCase();
    message.crc = rspCrc === crc;

    // this.emit('recvCommand', cmd);
    // debug('Parsed command: %j', cmd);
    // debug('Status: %j', status);
    const id = message.id.toString().toUpperCase();

    /* if (this.devices[id]) {
      this.handleCommand(this.devices[id], cmd);
    } */

    const requestId = request?.destinationId?.toString();

    if (requestId !== id) {
      // command isn't a response for a command we sent
      console.log(
        `message not from command we sent req: ${requestId} resp: ${id}`
      );
      // this.emit('command', cmd);
      return MessageType.SKIPPED;
    }

    if (!request.response) {
      request.response = {};
    }

    request.response.extended = message;
    request.success =
      message.extended !== undefined && message.extended !== null;

    return MessageType.PROCESSED;
  }
}
