import { toHex } from "../util";

export const INSTEON_ID_REGEX = /^[\dA-Fa-f]{6}$/;

export default class InsteonId {
  private value: string;

  private raw: string;

  constructor(id: string) {
    const processed = id.trim().replace(/\./g, "");
    if (!INSTEON_ID_REGEX.test(processed)) {
      throw new Error(`Invalid Insteon ID: ${id} (${processed})`);
    }
    this.value = processed;
    this.raw = id;
  }

  static fromBytes(a: number, b: number, c: number): InsteonId {
    const str = `${toHex(a, 2)}${toHex(b, 2)}${toHex(c, 2)}`;

    return new InsteonId(str);
  }

  toString(): string {
    return this.value;
  }

  toRawString(): string {
    return this.raw;
  }
}
