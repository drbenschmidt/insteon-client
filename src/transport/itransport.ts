import { EventEmitter } from 'events';
import { DeviceCommand } from '../model/device';

export interface ITransport {
  pipeEvents(emitter: EventEmitter): void;
  open(): void;
  close(): void;
  send(message: DeviceCommand): Promise<{ data: string; }>;
}
