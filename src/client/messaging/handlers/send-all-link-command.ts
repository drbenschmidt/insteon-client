/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import type MessageHandler from "../handler";
import { IDispatcher } from "./idispatcher";
import DispatcherBase from "./dispatcher-base";
import { MessageType } from "../constants";
import { InsteonRequestWrapper } from "../../../model/api/insteon-message";
import { fromHex } from "../../../model/util";

export default class Dispatcher extends DispatcherBase {
  id = "0261";

  name = "Send All Link Command";

  size = 12;

  register(map: Map<string, IDispatcher>): void {
    map.set(this.id, this);
  }

  handle(
    handler: MessageHandler,
    raw: string,
    request: InsteonRequestWrapper
  ): MessageType {
    const parts = raw
      .split("")
      .map((_, index, array) =>
        !(index % 2) ? `${array[index]}${array[index + 1]}` : undefined
      )
      .filter((a) => a)
      .map((value) => fromHex(value));

    const [group, cmd1, cmd2, ack] = parts;

    console.log(parts);

    return MessageType.PROCESSED;
  }
}
