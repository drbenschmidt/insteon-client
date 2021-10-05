/* eslint-disable no-bitwise */
import { MessageField } from "../types";

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

export default flags;
