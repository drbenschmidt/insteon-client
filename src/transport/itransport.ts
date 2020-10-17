import { DeviceCommand } from '../model/device';

export interface ITransport {
  init(host: string, port: number, username: string, password: string): void;
  open(): void;
  close(): void;
  send(message: DeviceCommand): Promise<{ data: string; }>;
}
