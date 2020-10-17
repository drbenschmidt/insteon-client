// TODO: Add support for levels, and cool stuff.
// For now, just make it prefixable.

export default class Logger {
  private prefix: string;
  private parent: Logger;

  constructor(prefix: string, parent: Logger = null) {
    this.prefix = prefix;
    this.parent = parent;
  }

  debug(message: string) {
    const msg = `[${this.prefix}] ${message}`;

    if (this.parent) {
      this.parent.debug(msg);
    } else {
      console.debug(msg);
    }
  }
}
