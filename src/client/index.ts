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
import DeviceBase from "../model/device/device-base";

export type ClientProperties = {
  transportFn: (context: Context) => ITransport;
  logLevel?: LogLevel;
};

export const timeout = (time: number): Promise<void> =>
  new Promise((resolve, reject) =>
    setTimeout(() => reject(new Error(`${time}ms timeout elapsed`)), time)
  );

export default class Client {
  private transport: ITransport;
  private sendCommandMutex = new Mutex();
  private protocol: Protocol;
  private context: Context;
  log: Logger;

  constructor(properties: ClientProperties) {
    const { transportFn, logLevel } = properties;

    this.context = new Context({ logLevel });
    this.transport = transportFn(this.context);
    this.log = new Logger("Client", this.context.logger);
    this.protocol = new Protocol({
      transport: this.transport,
      context: this.context,
    });
  }

  static async createFor2245(config: ClientConfig): Promise<Client> {
    const HttpTransport = (await import("../transport/http")).default;
    const transport = (context: Context) => new HttpTransport(config, context);

    return new Client({ transportFn: transport, logLevel: config.logLevel });
  }

  async open(): Promise<void> {
    await this.transport.open();
  }

  async sendRaw(raw: string, awaitMessageType?: string): Promise<any> {
    return this.sendCommandMutex.dispatch(async () => {
      // This helps prevent weird issues with getting messages after sending them.
      await sleep(100);

      const requestPromise = new Promise((resolve, reject) => {
        let type = awaitMessageType;
        if (!type) {
          type = `${raw[2]}${raw[3]}`;
        }
        console.log("waiting for", `message_type_${type}`);
        // TODO: make this less dumb.
        this.context.emitter.once(`message_type_${type}`, (response: any) => {
          resolve(response);
        });

        this.transport.send({ raw }).catch(reject);
      });

      const timeoutPromise = timeout(5000);

      return Promise.race([requestPromise, timeoutPromise]);
    });
  }

  async sendCommand(request: InsteonRequest): Promise<InsteonResponse> {
    // TODO: check for transport ready.
    return this.sendCommandMutex.dispatch(async () => {
      // This helps prevent weird issues with getting messages after sending them.
      await sleep(100);

      const requestPromise = new Promise((resolve, reject) => {
        if (request.destinationId) {
          this.context.emitter.once(
            `command_${request.destinationId.toString()}`,
            (response: InsteonResponse) => {
              this.log.debug("[sendCommand] Message Received", response);
              resolve(response);
            }
          );
        }

        // Send the command!
        this.transport.send({ raw: request.raw }).catch(reject);
      });

      const timeoutPromise = timeout(5000);

      return Promise.race([requestPromise, timeoutPromise]);
    });
  }

  getDevice(id: string): DeviceBase {
    return new Light(id, this);
  }
}
