import { ITransport } from "../transport/itransport";
import Logger, { LogLevel } from "../utils/logger";
import { ClientConfig } from "../model/config";
import Mutex from "../utils/mutex";
import { InsteonRequest } from "../model/api/insteon-message";
import { InsteonResponse } from "../model/api/response/insteon-response";
import Light from "../model/device/light";
import sleep from "../utils/sleep";
import Protocol from "./protocol";
import Context from "./context";

export type ClientProperties = {
  transport: ITransport;
  logLevel?: LogLevel;
};

export default class Client {
  private transport: ITransport;
  private sendCommandMutex = new Mutex();
  private protocol: Protocol;
  private context: Context;
  log: Logger;

  constructor(properties: ClientProperties) {
    const { transport, logLevel } = properties;

    this.context = new Context({ logLevel });
    // TODO: rename to setEmitter?
    transport.pipeEvents(this.context.emitter);

    this.log = new Logger("Client", this.context.logger);
    this.protocol = new Protocol({ transport, context: this.context });
    this.transport = transport;
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
    // TODO: check for transport ready.
    return this.sendCommandMutex.dispatch(async () => {
      // This helps prevent weird issues with getting messages after sending them.
      await sleep(100);

      return new Promise((resolve, reject) => {
        // TODO: Add a timeout, do a promise race, clean up once on timeout.
        this.context.emitter.once(
          `command_${request.destinationId.toString()}`,
          (response: InsteonResponse) => {
            resolve(response);
          }
        );

        // Send the command!
        this.transport.send(request).catch(reject);
      });
    });
  }

  getDevice(id: string): Light {
    return new Light(id, this);
  }
}
