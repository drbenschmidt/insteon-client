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
      // Emit messages to listeners.
      emitter.emit("message", message);
      console.log(`message_type_${toHex(message.id, 2)}`);
      emitter.emit(`message_type_${toHex(message.id, 2)}`, message);

      if (hasAddress(message)) {
        const addrMessage = message as any;
        emitter.emit(`message_${addrMessage.address}`, message);
        emitter.emit(`command_${addrMessage.address}`, message);
      }
    });
  };
}

export default Protocol;
