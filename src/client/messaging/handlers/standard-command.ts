/* eslint-disable class-methods-use-this */
import type MessageHandler from "../handler";
import { IDispatcher } from "./idispatcher";
import DispatcherBase from "./dispatcher-base";
import parseMessageReceived from "../utils";
import { MessageType } from "../constants";
import DeviceCommandRequest from "../../../model/api/device-command-request";
import { InsteonMessage } from "../../../model/api/insteon-message";

export default class Dispatcher extends DispatcherBase {
  id = "0250";

  name = "Standard Command";

  register(map: Map<string, IDispatcher>): void {
    map.set(this.id, this);
  }

  handle(
    handler: MessageHandler,
    raw: string,
    request: DeviceCommandRequest
  ): MessageType {
    const message = parseMessageReceived(raw);

    // console.log('recieved command', cmd);
    // this.emit('recvCommand', cmd);
    // debug('Parsed command: %j', cmd);
    // debug('Status: %j', status);
    const id = message.id.toString().toUpperCase();
    // debug('Devices: %j', Object.keys(this.devices));

    // TODO: Allow device objects to be notified to update based on the response.
    /* if (this.devices[id]) {
      console.log(`Handle Command for device: ${id}`);
      //this.handleCommand(this.devices[id], cmd);
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

    const { responseCount } = request.request;

    if (responseCount) {
      let standard = request?.response.standard as Array<InsteonMessage>;
      if (!standard) {
        standard = new Array<InsteonMessage>();
      }
      standard.push(message);
      request.success = standard.length === responseCount;
    } else {
      request.response.standard = message;
      request.success =
        message !== undefined &&
        message !== null &&
        (!request.request.extended || !!request.request.isStandardResponse) &&
        !request.request.waitForExtended &&
        !request.request.waitForLinking;
    }

    return MessageType.PROCESSED;
  }
}
