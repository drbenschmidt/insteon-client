import { DeviceCommand, DeviceCommandRequest } from '../model/device';
import { ITransport } from '../transport/itransport';
import { Light } from '../model/device';
import Logger from '../utils/logger';
import { EventEmitter } from 'events'
import { ClientConfig } from '../model/config';
import MessageHandler from './message-handler';

export default class Client extends EventEmitter {
  private transport: ITransport;
  private messageHandler: MessageHandler = new MessageHandler();
  static log: Logger = new Logger('Client');

  constructor(transport: ITransport) {
    super();

    this.transport = transport;
    transport.pipeEvents(this);
    
    this.on('buffer', this.messageHandler.process);
  }

  static async createFor2245(config: ClientConfig) {
    Client.log.debug('Creating Client w/HTTP transport');

    const HttpTransport = (await import('../transport/http')).default;
    const transport = new HttpTransport(config);

    return new Client(transport);
  }

  open() {
    this.transport.open();
  }

  async sendCommand(command: DeviceCommand) {
    const request = new DeviceCommandRequest(command.command, (resp: any) => {
      Client.log.debug(`Gottem! ${JSON.stringify(resp)}`);
    });

    this.messageHandler.setRequest(request);
    await this.transport.send(command);
  }

  getDevice(id: string): Light {
    return new Light(id, this);
  }
}
