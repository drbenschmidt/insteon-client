import { toByteArray, toHex } from "../../model/util";
import { messages } from "./messages";

const trimBuffer = (buffer: number[]) => {
  while (buffer[0] !== 0x02) {
    buffer.shift();
  }
};

const getMessageFor = (id: number) => {
  const builder = Object.values(messages).find((a) => a.id === id);

  return builder;
};

export default class Handler2 {
  process(raw: string): void {
    const buffer = toByteArray(raw);
    trimBuffer(buffer);

    // Remove the 0x02, we know we're good.
    buffer.shift();

    // Take the message ID off, we don't need that in the message body.
    const messageId = buffer.shift();
    const builder = getMessageFor(messageId);
    if (!builder) {
      console.log(
        `[Handler2.process] builder not found for MessageId 0x${toHex(
          messageId
        )}`
      );
      return;
    }
    const message = builder(buffer);

    console.log("[Handler2.process]", message);
  }
}
