import { EventEmitter } from "events";
import Logger from "./logger";

export default class AsyncLoop {
  private loopId: NodeJS.Timeout;

  private pollTimeoutMs: number;

  private emitter: EventEmitter;

  private log: Logger;

  private onTick: Function;

  constructor(pollTimeoutMs: number, log: Logger, onTick: Function) {
    this.pollTimeoutMs = pollTimeoutMs;
    this.log = new Logger("BufferLoop", log);
    this.onTick = onTick;
  }

  pipeEvents(emitter: EventEmitter) {
    this.emitter = emitter;
  }

  start() {
    if (this.loopId) {
      clearTimeout(this.loopId);
    }

    this.loopId = setTimeout(this.tick, this.pollTimeoutMs);
  }

  stop() {
    clearTimeout(this.loopId);
  }

  scheduleIn(timeoutMs: number) {
    this.log.debug(`forcing tick in ${timeoutMs}ms`);
    clearTimeout(this.loopId);

    this.loopId = setTimeout(this.tick, timeoutMs);
  }

  tick = async () => {
    this.log.debug("Tick Start");
    try {
      await this.onTick();
    } catch (error) {
      this.log.debug(`onTick error: ${error.message}`);
      console.error(error);
    } finally {
      this.start();
    }
  };
}
