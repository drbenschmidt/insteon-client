import { EventEmitter } from "events";
import { ITransport } from "../transport/itransport";
import Logger, { LogLevel } from "../utils/logger";
import { ClientConfig } from "../model/config";
import MessageHandler from "./messaging/handler";
import { process } from "./messaging/handler2";
import Mutex from "../utils/mutex";
import {
  InsteonRequestWrapper,
  InsteonRequest,
} from "../model/api/insteon-message";
import { InsteonResponse } from "../model/api/response/insteon-response";
import Light from "../model/device/light";
import sleep from "../utils/sleep";

export type ClientProperties = {
  transport: ITransport;
  logLevel?: LogLevel;
};

export default class Client extends EventEmitter {
  private transport: ITransport;

  // private messageHandler: MessageHandler2;

  private sendCommandMutex = new Mutex();

  log: Logger;

  constructor(properties: ClientProperties) {
    super();

    const { transport, logLevel } = properties;

    this.log = new Logger("Client", undefined, logLevel);

    this.transport = transport;
    transport.pipeEvents(this);

    this.on("buffer", process);
  }

  static async createFor2245(config: ClientConfig): Promise<Client> {
    const HttpTransport = (await import("../transport/http")).default;
    const transport = new HttpTransport(config);

    return new Client({ transport, logLevel: config.logLevel });
  }

  async open(): Promise<void> {
    await this.transport.open();
  }

  async sendCommand(request: InsteonRequest): Promise<InsteonResponse> {
    return this.sendCommandMutex.dispatch(async () => {
      // This helps prevent weird issues with getting messages after sending them.
      await sleep(100);

      return new Promise((resolve, reject) => {
        const requestWrapper = new InsteonRequestWrapper(
          request,
          (response: InsteonResponse) => {
            this.transport.setListen(false);
            resolve(response);
          }
        );

        // Set the request to the message handler so it knows what we're processing.
        // this.messageHandler.setRequest(requestWrapper);

        // Tell the transport layer that we're expecting more than one response.
        this.transport.setListen(true);

        // Send the command!
        this.transport.send(request).catch(reject);
      });
    });
  }

  getDevice(id: string): Light {
    return new Light(id, this);
  }
}
