import { EventEmitter } from "events";
import Logger, { LogLevel } from "../utils/logger";

type ContextProps = {
  logLevel: LogLevel;
};

class Context {
  emitter = new EventEmitter();
  logger: Logger;

  constructor(props: ContextProps) {
    this.logger = new Logger("Context", undefined, props.logLevel);
  }
}

export default Context;
