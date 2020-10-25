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

  toString() {
    return this.value;
  }

  toRawString() {
    return this.raw;
  }
}
