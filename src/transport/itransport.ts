import { EventEmitter } from "events";
import { InsteonRequest } from "../model/api/insteon-message";

export interface ITransport {
  pipeEvents(emitter: EventEmitter): void;
  open(): Promise<void>;
  close(): void;
  send(message: InsteonRequest): Promise<{ data: string }>;
  setListen(value: boolean): void;
}
