import { toByteArray, toHex } from "../../model/util";
import { Flags, messages } from "./messages";

const trimBuffer = (buffer: number[]) => {
  while (buffer[0] !== 0x02) {
    buffer.shift();
  }
};

export const getMessageFor = (id: number, flagByte: number) => {
  const flags = new Flags(flagByte);
  const builder = Object.values(messages).find(
    (a) => a.id === id && a.isExtended === !!flags.extended
  );

  return builder;
};

const findMultipleMessages = (buffer: string): string[] => {
  // It's possible for us to read the buffer and get multiple messages in it.
  // So we'll split on 0x00 0x02, which is the end of one and the start of another.
  const found = buffer.split("0002");

  // After splitting, if we only have one, no need to modify it!
  if (found.length === 1) {
    return found;
  }

  // However, if we have more, we need to make sure they look as expected.
  // Right now our logic banks on where the bytes are and we need to shift everything
  // if our messages don't start with 0x02.

  return found.map((value, index) => {
    if (index === 0) {
      return value;
    }

    return `02${value}`;
  });
};

export const process = (raw: number[]): void => {
  let buffer = raw;
  if (typeof raw === "string") {
    buffer = toByteArray(raw);
  }
  trimBuffer(buffer);

  // Remove the 0x02, we know we're good.
  buffer.shift();

  // Take the message ID off, we don't need that in the message body.
  const messageId = buffer.shift();
  const flagByte = buffer[5];
  const builder = getMessageFor(messageId, flagByte);
  if (!builder) {
    console.log(
      `[Handler2.process] builder not found for MessageId 0x${toHex(messageId)}`
    );
    return;
  }

  // TODO: Logic to detect if it's a SEND_STANDARD 0x062, if it is,
  // calculate byteLength based on if it has the extended flag.

  if (buffer.length < builder.byteLength) {
    console.log(
      `[Handler2.process] not enough data in buffer for message 0x${toHex(
        messageId
      )} (missing ${builder.byteLength - buffer.length} bytes)`
    );
  }

  const msgBuf = buffer.splice(0, builder.byteLength);

  // NOTE: I think there may be a case where an incoming message can have varying lengths.
  // This is annoying >:(
  /*
  if (messageId === MessageId.SEND_STANDARD) {
    const flags = new Flags(buffer[5]);

    if (flags.extended) {
      
    }
  }
  */

  const message = builder(msgBuf);

  console.log("[Handler2.process]", message);
  console.log(buffer);

  if (buffer.length > 0) {
    console.log("[Handler2.process] extra bytes leftover, processing again");
    console.log(buffer);
    process(buffer);
  }
};
