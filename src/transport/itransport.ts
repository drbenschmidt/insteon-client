import { EventEmitter } from 'events';
import DeviceCommand from '../model/api/device-command';

export interface ITransport {
  pipeEvents(emitter: EventEmitter): void;
  open(): void;
  close(): void;
  send(message: DeviceCommand): Promise<{ data: string; }>;
  setListen(val: Boolean): void;
}
