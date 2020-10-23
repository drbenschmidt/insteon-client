import { DeviceCommand, DeviceCommandRequest } from '../model/device';
import { ITransport } from '../transport/itransport';
import { Light, InsteonResponse } from '../model/device';
import Logger from '../utils/logger';
import { EventEmitter } from 'events'
import { ClientConfig } from '../model/config';
import MessageHandler from './message-handler';
import Mutex from '../utils/mutex';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export default class Client extends EventEmitter {
  private transport: ITransport;
  private messageHandler: MessageHandler = new MessageHandler();
  static log: Logger = new Logger('Client');
  private sendCommandMutex = new Mutex();

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

  async sendCommand(command: DeviceCommand): Promise<InsteonResponse> {
    return this.sendCommandMutex.dispatch(async () => {
      await sleep(1000);

      return new Promise((resolve, reject) => {
        const request = new DeviceCommandRequest(command, (request: DeviceCommandRequest) => {
          this.transport.setListen(false);
          resolve(request.response);
        });
    
        this.messageHandler.setRequest(request);

        this.transport.setListen(true);
        this.transport.send(command);
      });
    });
  }

  getDevice(id: string): Light {
    return new Light(id, this);
  }
}
