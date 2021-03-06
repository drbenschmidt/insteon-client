export enum LogLevel {
  Debug = 4,
  Info = 3,
  Warn = 2,
  Error = 1,
}

export default class Logger {
  private prefix: string;

  private parent: Logger;

  private level: LogLevel;

  constructor(prefix: string, parent?: Logger, level?: LogLevel) {
    this.prefix = prefix;
    this.parent = parent;

    if (level === undefined && parent !== undefined) {
      this.level = parent.level;
    } else {
      this.level = level ?? LogLevel.Info;
    }
  }

  private log(level: LogLevel, message: string, ...rest: any[]) {
    if (level > this.level) {
      return;
    }

    let logFunction;

    switch (level) {
      case LogLevel.Debug:
        logFunction = this.parent?.debug ?? console.debug;
        break;

      case LogLevel.Info:
        logFunction = this.parent?.info ?? console.info;
        break;

      case LogLevel.Warn:
        logFunction = this.parent?.warn ?? console.warn;
        break;

      case LogLevel.Error:
        logFunction = this.parent?.error ?? console.error;
        break;

      default:
        break;
    }

    const formattedMessage = `[${this.prefix}] ${message}`;

    logFunction?.(formattedMessage, ...rest);
  }

  debug = (message: string, ...rest: any[]) =>
    this.log(LogLevel.Debug, message, ...rest);

  info = (message: string, ...rest: any[]) =>
    this.log(LogLevel.Info, message, ...rest);

  warn = (message: string, ...rest: any[]) =>
    this.log(LogLevel.Warn, message, ...rest);

  error = (message: string, ...rest: any[]) =>
    this.log(LogLevel.Error, message, ...rest);
}
