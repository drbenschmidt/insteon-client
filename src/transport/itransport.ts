import { EventEmitter } from "events";

export interface ITransport {
  pipeEvents(emitter: EventEmitter): void;
  open(): Promise<void>;
  close(): void;
  send(message: { raw: string }): Promise<{ data: string }>;
  setListen(value: boolean): void;
}
