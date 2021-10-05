import { MessageField } from "../types";

/* eslint-disable no-bitwise */
const isBitSet = (bitmask: number, bit: number) =>
  (bitmask & (1 << (bit - 1))) > 0;

enum AllLinkMode {
  RESPONDER = 0x00,
  CONTROLLER = 0x01,
  EITHER = 0x03,
  DELETE = 0xff,
}

export class AllLinkRecordFlags {
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

export default allLinkRecordFlags;
