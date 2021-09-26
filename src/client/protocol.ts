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
    // console.log(this.context);
    const { emitter } = this.context;
    // TODO: Make process take buffer and context. Return array of messages.
    const messages = process(buffer, this.context);

    messages.forEach((message) => {
      // console.log("[BEN]", this.context.emitter);
      // console.log("[BEN]", message);
      // Emit messages to listeners.
      emitter.emit("message", message);

      if (hasAddress(message)) {
        emitter.emit(`message_${message.address}`);
        emitter.emit(`command_${message.address}`);
      }
    });
  };
}

export default Protocol;
