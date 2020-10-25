import { Agent, request } from "http";
import { EventEmitter } from "events";
import DeviceCommand from "../model/api/device-command";
import { ITransport } from "./itransport";
import Logger from "../utils/logger";
import { ClientConfig } from "../model/config";
import Mutex from "../utils/mutex";

/**
 * The Http Transport allows communication with 2245 Hubs.
 * The gist of it is, commands are sent to a known endpoint which responds with
 * whether or not the command was successfully recieved and interpreted. The
 * response contains no information about the result of the command.
 *
 * There is an event buffer that can be read, and uppon reading, it will
 * not clear it - that must be done seperately.
 *
 * The HTTP server on the hub is single threaded, which means there can be no parallel requests
 * or we risk running into them being dropped. A message queue is implemented to prevent this.
 */
export default class Http implements ITransport {
  private log: Logger;

  private config: ClientConfig;

  private agent: Agent;

  private emitter: EventEmitter;

  private knownBufferPage = "";

  private mutex = new Mutex();

  private listen = false;

  constructor(config: ClientConfig) {
    this.config = config;
    this.agent = new Agent({
      maxSockets: 1, // Most important config: insteon hub does not like having tons of sockets
      keepAlive: true,
      keepAliveMsecs: 5000, // Be nice and give the socket back in 5sec.
    });
    this.log = new Logger("HTTP", undefined, config.logLevel);
  }

  setListen(value: boolean): void {
    this.log.debug(`listening ${value}`);
    this.listen = value;
  }

  open(): void {
    // Start event loop to keep checking for the buffer.
    // Http.log.debug('Starting event buffer loop');
    // this.looper.start();
  }

  close(): void {
    // TODO: This should just check the buffer one last time and respond to any remaining messages.
    // this.looper.stop();
  }

  fetchBuf = async () => {
    this.log.debug("Fetching buffer");
    const { data } = await this.httpGet({
      path: "/buffstatus.xml",
    });

    // data looks like <response><BS>(202 characters of hex)</BS></response>
    // in lieu of using an XML parser adding another library dependency, we will
    // just use a bit of regex to parse it.
    let raw = /BS>([^<]+)<\/BS/g.exec(data)[1];
    if (raw.length === 202) {
      // The last 2 bytes are the length of 'good' data
      const length = Number.parseInt(raw.slice(200), 16);
      this.log.debug(`Raw response (length ${length})`);
      raw = raw.slice(0, Math.max(0, length));
    }
    let result = raw;
    if (
      this.knownBufferPage.length &&
      raw.slice(0, Math.max(0, this.knownBufferPage.length)) ===
        this.knownBufferPage
    ) {
      result = raw.slice(this.knownBufferPage.length);
    }
    this.knownBufferPage = raw;
    if (result.length) {
      this.log.debug(`good buffer length: ${raw.length}`);
      this.emitter.emit("buffer", result);
    }

    if (raw.length > 30) {
      await this.clearBuffer();
    }

    if (this.listen) {
      setTimeout(this.fetchBuf, 50);
    }
  };

  private async clearBuffer() {
    this.log.debug("clearing buffer");

    await this.httpGet({
      path: "/1?XB=M=1",
    });
  }

  private async httpGet(requestOptions: any): Promise<{ data: string }> {
    return this.mutex.dispatch(async () => {
      const { host, port, user, pass } = this.config;
      const options = {
        hostname: host,
        port,
        agent: this.agent,
        auth: `${user}:${pass}`,
        path: "",
        ...requestOptions,
      };

      this.log.debug(`GET request to http://${host}:${port}${options.path}`);

      return new Promise((resolve, reject) => {
        request(options, (res) => {
          this.log.debug(
            `Response Code: ${res.statusCode}, ${res.statusMessage}`
          );
          if (res.statusCode !== 200) {
            reject(res.statusMessage);
            return;
          }

          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            resolve({
              data,
            });
          });

          res.on("error", reject);
        }).end();
      });
    });
  }

  async send(message: DeviceCommand): Promise<{ data: string }> {
    const options = {
      path: `/3?${message.raw}=I=3`,
    };

    const result = await this.httpGet(options);

    // Schedule this 50ms after to allow the hub time
    // to get it's ducks in a row.
    setTimeout(this.fetchBuf, 50);

    return result;
  }

  pipeEvents(emitter: EventEmitter): void {
    this.emitter = emitter;
  }
}
