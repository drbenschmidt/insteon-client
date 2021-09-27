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

      if (hasAddress(message)) {
        emitter.emit(`message_${message.address}`, message);
        emitter.emit(`command_${message.address}`, message);
      }
    });
  };
}

export default Protocol;
