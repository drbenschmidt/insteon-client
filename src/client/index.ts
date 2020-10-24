import { DeviceCommand, DeviceCommandRequest } from '../model/device';
import { ITransport } from '../transport/itransport';
import { Light, InsteonResponse } from '../model/device';
import Logger from '../utils/logger';
import { EventEmitter } from 'events'
import { ClientConfig } from '../model/config';
import MessageHandler from './messaging/handler';
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
      // This helps prevent weird issues with getting messages after sending them.
      await sleep(100);

      // TODO: add reject logic for errors.
      return new Promise((resolve, reject) => {
        const request = new DeviceCommandRequest(command, (request: DeviceCommandRequest) => {
          this.transport.setListen(false);
          resolve(request.response);
        });
    
        // Set the request to the message handler so it knows what we're processing.
        this.messageHandler.setRequest(request);

        // Tell the transport layer that we're expecting more than one response.
        this.transport.setListen(true);

        // Send the command!
        this.transport.send(command);
      });
    });
  }

  getDevice(id: string): Light {
    return new Light(id, this);
  }
}
