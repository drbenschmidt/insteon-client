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
import { NextAllLinkRecordMessage } from "./messaging/messages";

export enum AckNak {
  ACK = 0x06,
  NAK = 0x15,
}

export type ClientProperties = {
  transportFn: (context: Context) => ITransport;
  logLevel?: LogLevel;
};

export const timeout = <T>(time: number): Promise<T> =>
  new Promise((resolve, reject) =>
    setTimeout(() => reject(new Error(`${time}ms timeout elapsed`)), time)
  );

class DeviceDatabase {
  private client: Client;
  private context: Context;
  readonly devices: any[] = [];

  constructor(client: Client, context: Context) {
    this.client = client;
    this.context = context;
  }

  async init(forceRefresh = true): Promise<void> {
    this.context.logger.info("Initializing Device Database");
    if (forceRefresh || this.devices.length === 0) {
      await this.fetchFromModem();
    } else {
      await this.fetchFromCache();
    }
  }

  async fetchFromCache(): Promise<void> {

  }

  async fetchFromModem(): Promise<void> {
    let fetching = true;
    const onDeviceMessage = (result) => {
      this.context.logger.info("Found device!");
      this.devices.push(result);
    };
    this.context.emitter.on("message_type_57", onDeviceMessage);

    // Send the first one.
    await this.client.sendRaw("0269", "69");

    while (fetching) {
      const result = await this.client.sendRaw<NextAllLinkRecordMessage>(
        "026A",
        "6A"
      );

      if (result.ack === AckNak.NAK) {
        fetching = false;
        this.context.emitter.off("message_type_57", onDeviceMessage);
      }
    }
  }
}

export default class Client {
  private transport: ITransport;
  private sendCommandMutex = new Mutex();
  private protocol: Protocol;
  private context: Context;
  log: Logger;
  db: DeviceDatabase;

  constructor(properties: ClientProperties) {
    const { transportFn, logLevel } = properties;

    this.context = new Context({ logLevel });
    this.transport = transportFn(this.context);
    this.log = new Logger("Client", this.context.logger);
    this.protocol = new Protocol({
      transport: this.transport,
      context: this.context,
    });
    this.db = new DeviceDatabase(this, this.context);
  }

  static async createFor2245(config: ClientConfig): Promise<Client> {
    const HttpTransport = (await import("../transport/http")).default;
    const transport = (context: Context) => new HttpTransport(config, context);

    return new Client({ transportFn: transport, logLevel: config.logLevel });
  }

  async open(): Promise<void> {
    await this.transport.open();
  }

  async sendRaw<TMessage>(
    raw: string,
    awaitMessageType: string
  ): Promise<TMessage> {
    return this.sendCommandMutex.dispatch<TMessage>(async () => {
      // This helps prevent weird issues with getting messages after sending them.
      await sleep(10);

      const requestPromise = new Promise<TMessage>((resolve, reject) => {
        // TODO: make this less dumb.
        this.context.emitter.once(
          `message_type_${awaitMessageType}`,
          (response: any) => {
            resolve(response);
          }
        );

        this.transport.send({ raw }).catch(reject);
      });

      const timeoutPromise = timeout<TMessage>(5000);

      return Promise.race<TMessage>([requestPromise, timeoutPromise]);
    });
  }

  async sendCommand(request: InsteonRequest): Promise<InsteonResponse> {
    // TODO: check for transport ready.
    return this.sendCommandMutex.dispatch(async () => {
      // This helps prevent weird issues with getting messages after sending them.
      await sleep(10);

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
