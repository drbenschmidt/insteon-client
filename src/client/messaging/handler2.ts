import { toHex } from "../../model/util";
import Context from "../context";
import { AbstractMessage, Flags, MessageBuilder, messages } from "./messages";

const trimBuffer = (buffer: number[]) => {
  while (buffer[0] !== 0x02) {
    buffer.shift();
  }
};

export const getMessageFor = <T>(
  id: number,
  flagByte: number
): MessageBuilder<T> => {
  const flags = new Flags(flagByte);
  const isExtended = !!flags.extended;
  const builder = Object.values(messages).find(
    (a) => a.id === id && (a.isExtendable ? a.isExtended === isExtended : true)
  );

  return (builder as unknown) as MessageBuilder<T>;
};

export const process = (
  buffer: number[],
  context: Context
): AbstractMessage[] => {
  const result: any[] = [];

  trimBuffer(buffer);

  // Remove the 0x02, we know we're good.
  buffer.shift();

  // Take the message ID off, we don't need that in the message body.
  const messageId = buffer.shift();
  const flagByte = buffer[5];
  const builder = getMessageFor(messageId, flagByte);

  if (!builder) {
    context.logger.debug(
      `[Handler2.process] builder not found for MessageId 0x${toHex(messageId)}`
    );
    return result;
  }

  if (buffer.length < builder.byteLength) {
    context.logger.debug(
      `[Handler2.process] not enough data in buffer for message 0x${toHex(
        messageId
      )} (missing ${builder.byteLength - buffer.length} bytes)`
    );
    return result;
  }

  const msgBuf = buffer.splice(0, builder.byteLength);
  const message = builder(msgBuf);
  result.push(message);

  context.logger.debug("[Handler2.process]", message);

  if (buffer.length > 0) {
    context.logger.debug(
      "[Handler2.process] extra bytes leftover, processing again"
    );
    result.push(...process(buffer, context));
  }

  return result;
};
