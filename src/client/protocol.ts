import { toHex } from "../model/util";
import { ITransport } from "../transport/itransport";
import Context from "./context";
import { process } from "./messaging/handler2";

const hasAddress = (message: any) => {
  return Object.keys(message).includes("address");
};

type ProtocolProps = {
  transport: ITransport;
  context: Context;
};

class Protocol {
  context: Context;

  constructor(props: ProtocolProps) {
    const { context } = props;

    this.context = context;
    context.emitter.on("buffer", this.onBuffer);
  }

  onBuffer = (buffer: number[]): void => {
    const { emitter } = this.context;
    const messages = process(buffer, this.context);

    messages.forEach((message) => {
      const type = toHex(message.id, 2);

      // Emit messages to listeners.
      emitter.emit("message", message);
      emitter.emit(`message_${type}`, message);

      if (hasAddress(message)) {
        const addrMessage = message as any;
        emitter.emit(`message_${type}_${addrMessage.address}`, message);
        emitter.emit(`command_${type}_${addrMessage.address}`, message);
      }
    });
  };
}

export default Protocol;
