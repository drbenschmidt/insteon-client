import { DeviceCommand } from '../model/device';
import { ITransport } from '../transport/itransport';
import { Light } from '../model/device';

interface ClientConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export default class Client {
  private transport: ITransport;

  constructor(transport: ITransport) {
    this.transport = transport;
  }

  static async createFor2245(config: ClientConfig) {
    const HttpTransport = (await import('../transport/http')).default;
    const transport = new HttpTransport();

    transport.init(config.host, config.port, config.user, config.pass);

    return new Client(transport);
  }

  async sendCommand(command: DeviceCommand) {
    await this.transport.send(command);
  }

  getDevice(id: string): Light {
    return new Light(id, this);
  }
}
