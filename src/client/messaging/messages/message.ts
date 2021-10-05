import { sum } from "../../../model/util";
import { AbstractMessage, MessageField } from "./types";

export type MessageBuilder<TMessage> = {
  (bytes: number[]): TMessage;
  id: number;
  byteLength: number;
  isExtended: boolean;
  isExtendable: boolean;
};

const message = <TMessage extends AbstractMessage>(
  id: number,
  ...fields: MessageField[]
): MessageBuilder<TMessage> => {
  const builder = (bytes: number[]) => {
    let arr = bytes;

    return fields.reduce(
      (acc, f) => {
        const [value, rest] = f(arr);
        arr = rest;
        return {
          ...acc,
          ...value,
        };
      },
      { id }
    ) as TMessage;
  };

  builder.id = id;
  builder.byteLength = sum(fields.map((field) => field.byteLength));
  builder.isExtended = false;
  // HACK: Message lookup needs to be able to know if a message could
  // be extendable upfront, and not just if it is or isn't an extended message.
  builder.isExtendable = false;

  return builder;
};

export default message;
