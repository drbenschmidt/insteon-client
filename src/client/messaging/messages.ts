/* eslint-disable max-classes-per-file */
/* eslint-disable no-bitwise */
import InsteonId from "../../model/api/insteon-id";
import { sum } from "../../model/util";
import { MessageId } from "./message-id";

const int = (name: string): MessageField => {
  const reducer = (value: number[]): [Record<string, number>, number[]] => {
    const [v, ...rest] = value;

    return [{ [name]: v }, rest];
  };

  reducer.byteLength = 1;

  return reducer;
};

const address = (name: string): MessageField => {
  const reducer = (value: number[]): [Record<string, any>, number[]] => {
    const [a, b, c, ...rest] = value;
    const id = InsteonId.fromBytes(a, b, c);

    return [{ [name]: id }, rest];
  };

  reducer.byteLength = 3;

  return reducer;
};

class UserData {
  private data: Map<string, number> = new Map<string, number>();

  constructor(bytes: number[]) {
    bytes.forEach((val, index) => {
      this.data.set(`d${index + 1}`, val);
    });
  }

  toString() {
    return Array.from(this.data.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join(",");
  }

  setChecksum(cmd1: number, cmd2: number) {}

  setCrc(cmd1: number, cmd2: number) {}
}

const userData = (name: string): MessageField => {
  const reducer = (value: number[]): [Record<string, any>, number[]] => {
    const data = value.slice(0, 14);
    const rest = value.slice(14);
    const temp = new UserData(data);

    return [{ [name]: temp }, rest];
  };

  reducer.byteLength = 14;

  return reducer;
};

enum MessageFlagType {
  DIRECT = 0,
  DIRECT_ACK = 1,
  ALL_LINK_CLEANUP = 2,
  ALL_LINK_CLEANUP_ACK = 3,
  BROADCAST = 4,
  DIRECT_NAK = 5,
  ALL_LINK_BROADCAST = 6,
  ALL_LINK_CLEANUP_NAK = 7,
}

const EXTENDED_MESSAGE = 0x10;

export class Flags {
  type: MessageFlagType;
  extended: number;
  hopsLeft: number;
  maxHops: number;

  constructor(value: number) {
    this.type = ((value & 0xe0) >> 5) as MessageFlagType;
    this.extended = (value & EXTENDED_MESSAGE) >> 4;
    this.hopsLeft = (value & 0x0c) >> 2;
    this.maxHops = value & 0x03;
  }
}

const flags = (name: string): MessageField => {
  const reducer = (value: number[]): [Record<string, any>, number[]] => {
    const [byte, ...rest] = value;
    const result = new Flags(byte);

    return [{ [name]: result }, rest];
  };

  reducer.byteLength = 1;

  return reducer;
};

type MessageField = {
  (value: number[]): [Record<string, any>, number[]];
  byteLength: number;
};

export interface AbstractMessage {
  id: number;
}

const message = <TMessage extends AbstractMessage>(
  id: number,
  ...fields: MessageField[]
) => {
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

const isBitSet = (bitmask: number, bit: number) =>
  (bitmask & (1 << (bit - 1))) > 0;

enum AllLinkMode {
  RESPONDER = 0x00,
  CONTROLLER = 0x01,
  EITHER = 0x03,
  DELETE = 0xff,
}

class AllLinkRecordFlags {
  inUse: boolean;
  isController: boolean;
  mode: AllLinkMode;
  bit5: boolean;
  bit4: boolean;
  bit3: boolean;
  bit2: boolean;
  hwm: boolean;
  bit0: boolean;
  constructor(data: number) {
    this.inUse = isBitSet(data, 7);
    this.isController = isBitSet(data, 6);
    this.mode = AllLinkMode.RESPONDER;
    if (this.isController) {
      this.mode = AllLinkMode.CONTROLLER;
    }
    this.bit5 = isBitSet(data, 5);
    this.bit4 = isBitSet(data, 4);
    this.bit3 = isBitSet(data, 3);
    this.bit2 = isBitSet(data, 2);
    this.hwm = !isBitSet(data, 1);
    this.bit0 = isBitSet(data, 0);
  }
}

const allLinkRecordFlags = (name: string): MessageField => {
  const reducer = (value: number[]): [Record<string, any>, number[]] => {
    const [byte, ...rest] = value;
    const result = new AllLinkRecordFlags(byte);

    return [{ [name]: result }, rest];
  };

  reducer.byteLength = 1;

  return reducer;
};

interface SendAllLinkMessage extends AbstractMessage {
  group: number;
  cmd1: number;
  cmd2: number;
  ack: number;
  userData: UserData;
}

interface ExtendedMessage extends AbstractMessage {
  address: InsteonId;
  flags: Flags;
  cmd1: number;
  cmd2: number;
  userData?: UserData;
}

export const sendAllLinkMessage = message<SendAllLinkMessage>(
  MessageId.SEND_ALL_LINK_COMMAND,
  int("group"),
  int("cmd1"),
  int("cmd2"),
  int("ack")
);

const extendedMessageFields = [
  address("address"),
  flags("flags"),
  int("cmd1"),
  int("cmd2"),
];

export const sendExtendedMessage = message<ExtendedMessage>(
  MessageId.SEND_EXTENDED,
  ...extendedMessageFields
);

export const sendExtendedMessageExtended = message<ExtendedMessage>(
  MessageId.SEND_EXTENDED,
  ...extendedMessageFields,
  userData("userData")
);
sendExtendedMessageExtended.isExtended = true;
sendExtendedMessageExtended.isExtendable = true;

interface StandardReceivedMessage extends AbstractMessage {
  address: InsteonId;
  target: InsteonId;
  flags: Flags;
  cmd1: number;
  cmd2: number;
}

export const standardReceivedMessage = message<StandardReceivedMessage>(
  MessageId.STANDARD_RECEIVED,
  address("address"),
  address("target"),
  flags("flags"),
  int("cmd1"),
  int("cmd2")
);

export interface AllLinkRecordResponseMessage extends AbstractMessage {
  flags: AllLinkRecordFlags;
  group: number;
  target: InsteonId;
  data1: number;
  data2: number;
  data3: number;
}

export const allLinkRecordResponseMessage = message<
  AllLinkRecordResponseMessage
>(
  MessageId.ALL_LINK_RECORD_RESPONSE,
  allLinkRecordFlags("flags"),
  int("group"),
  address("target"),
  int("data1"),
  int("data2"),
  int("data3")
);

export interface FirstAllLinkRecordMessage extends AbstractMessage {
  ack: number;
}

export const firstAllLinkRecordMessage = message<FirstAllLinkRecordMessage>(
  MessageId.GET_FIRST_ALL_LINK_RECORD,
  int("ack")
);

export interface NextAllLinkRecordMessage extends AbstractMessage {
  ack: number;
}

export const nextAllLinkRecordMessage = message<NextAllLinkRecordMessage>(
  MessageId.GET_NEXT_ALL_LINK_RECORD,
  int("ack")
);

export const messages = {
  sendAllLinkMessage,
  sendExtendedMessage,
  standardReceivedMessage,
  firstAllLinkRecordMessage,
  nextAllLinkRecordMessage,
  allLinkRecordResponseMessage,
};
