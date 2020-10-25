import { ITransport } from '../transport/itransport';
import Logger, { LogLevel } from '../utils/logger';
import { EventEmitter } from 'events'
import { ClientConfig } from '../model/config';
import MessageHandler from './messaging/handler';
import Mutex from '../utils/mutex';
import DeviceCommand from '../model/api/device-command';
import DeviceCommandRequest from '../model/api/device-command-request';
import { InsteonResponse } from '../model/api/response/insteon-response';
import Light from '../model/device/light';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export type ClientProps = {
  transport: ITransport;
  logLevel?: LogLevel;
};

export default class Client extends EventEmitter {
  private transport: ITransport;
  private messageHandler: MessageHandler;
  private sendCommandMutex = new Mutex();
  log: Logger;

  constructor(props: ClientProps) {
    super();

    const {
      transport,
      logLevel,
    } = props;
    
    this.log = new Logger('Client', null, logLevel);

    this.transport = transport;
    transport.pipeEvents(this);

    this.messageHandler = new MessageHandler({ logLevel });
    this.on('buffer', this.messageHandler.process);
  }

  static async createFor2245(config: ClientConfig) {
    const HttpTransport = (await import('../transport/http')).default;
    const transport = new HttpTransport(config);

    return new Client({ transport, logLevel: config.logLevel });
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
