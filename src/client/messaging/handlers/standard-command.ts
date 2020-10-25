import type MessageHandler from "../handler";
import { IDispatcher } from "./idispatcher";
import DispatcherBase from "./dispatcher-base";
import { parseMessageReceived } from "../utils";
import { MessageType } from "../constants";

export default class Dispatcher extends DispatcherBase {
  id = "0250";

  name = "Standard Command";

  register(map: Map<string, IDispatcher>): void {
    map.set(this.id, this);
  }

  handle(handler: MessageHandler, raw: string, status: any): MessageType {
    const cmd = {
      standard: parseMessageReceived(raw),
    };
    // console.log('recieved command', cmd);
    // this.emit('recvCommand', cmd);
    // debug('Parsed command: %j', cmd);
    // debug('Status: %j', status);
    const id = cmd.standard.id.toUpperCase();
    // debug('Devices: %j', Object.keys(this.devices));

    // TODO: Allow device objects to be notified to update based on the response.
    /* if (this.devices[id]) {
      console.log(`Handle Command for device: ${id}`);
      //this.handleCommand(this.devices[id], cmd);
    } */

    const requestId = status?._command?.destinationId?.toString();

    if (requestId !== id) {
      // command isn't a response for a command we sent
      console.log(
        `message not from command we sent req: ${requestId} resp: ${id}`
      );
      // this.emit('command', cmd);
      return MessageType.SKIPPED;
    }

    if (!status.response) {
      status.response = {};
    }

    const { responseCount } = status.command;

    if (responseCount) {
      status.response.standard = status.response.standard || [];
      status.response.standard.push(cmd.standard);
      status.success = status.response.standard.length === responseCount;
    } else {
      status.response.standard = cmd.standard;
      status.success =
        cmd.standard !== undefined &&
        cmd.standard !== null &&
        (!status.command.extended || !!status.command.isStandardResponse) &&
        !status.command.waitForExtended &&
        !status.command.waitForLinking;
    }

    return MessageType.PROCESSED;
  }
}
