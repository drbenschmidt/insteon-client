import { Agent, request } from "http";
import { EventEmitter } from "events";
import { ITransport } from "./itransport";
import Logger from "../utils/logger";
import { ClientConfig } from "../model/config";
import Mutex from "../utils/mutex";
import { InsteonRequest } from "../model/api/insteon-message";
import { Stack } from "../utils/stack";
import AsyncLoop from "../utils/async-loop";
import { toByteArray } from "../model/util";
import Context from "../client/context";

const { parseInt } = Number;

const ZERO_FILLED_TEXT = "".padEnd(200, "0");

/**
 * The Http Transport allows communication with 2245 Hubs.
 * The gist of it is, commands are sent to a known endpoint which responds with
 * whether or not the command was successfully received and interpreted. The
 * response contains no information about the result of the command.
 *
 * There is an event buffer that can be read, and upon reading, it will
 * not clear it - that must be done separately.
 *
 * The HTTP server on the hub is single threaded, which means there can be no parallel requests
 * or we risk running into them being dropped. A message queue is implemented to prevent this.
 */
export default class Http implements ITransport {
  private log: Logger;
  private config: ClientConfig;
  private agent: Agent;
  private emitter: EventEmitter;
  private mutex = new Mutex();
  private lastRead = new Stack<number>();
  private looper: AsyncLoop;
  private lastBuffer = "";

  constructor(config: ClientConfig, context: Context) {
    this.config = config;
    this.agent = new Agent({
      maxSockets: 1, // Most important config: insteon hub does not like having tons of sockets
      keepAlive: true,
      keepAliveMsecs: 5000, // Be nice and give the socket back in 5sec.
    });
    this.log = new Logger("HTTP", context.logger);
    this.looper = new AsyncLoop(500, this.log, this.fetchBuf);
    this.emitter = context.emitter;
  }

  setListen(value: boolean): void {
    this.log.debug(`listening ${value}`);
    // this.listen = value;
  }

  async open(): Promise<void> {
    // Start event loop to keep checking for the buffer.
    this.log.debug("Starting event buffer loop");
    await this.clearBuffer();
    this.looper.start();
  }

  close(): void {
    // TODO: This should just check the buffer one last time and respond to any remaining messages.
    this.looper.stop();
  }

  fetchBuf = async (): Promise<void> => {
    let lastStop = 0;

    // this.log.debug("Fetching buffer");
    const { data } = await this.httpGet({
      path: "/buffstatus.xml",
    });

    // data looks like <response><BS>(202 characters of hex)</BS></response>
    // in lieu of using an XML parser adding another library dependency, we will
    // just use a bit of regex to parse it.
    const raw = /BS>([^<]+)<\/BS/g.exec(data)[1];
    const rawText = raw.slice(0, 200);
    const thisStop = parseInt(raw.slice(-2), 16);
    let buffer = "";

    // If the result is just 0s, nothing to see here, move on.
    if (rawText === ZERO_FILLED_TEXT) {
      return;
    }

    // Nothing new happened.
    if (this.lastBuffer === rawText) {
      return;
    }

    this.lastBuffer = rawText;

    if (this.lastRead.size() !== 0) {
      lastStop = this.lastRead.pop();
    }

    if (thisStop > lastStop) {
      this.log.debug(`Raw buffer: ${rawText}`);
      this.log.debug(`Buffer from ${lastStop} to ${thisStop}`);
      buffer = rawText.slice(lastStop, thisStop);
    } else if (thisStop < lastStop) {
      this.log.debug(`Raw buffer: ${rawText}`);
      this.log.debug(`Buffer from ${lastStop} to 200 and 0 to ${thisStop}`);
      let bufferHi = rawText.slice(lastStop, 200);

      if (bufferHi === "".padStart(bufferHi.length, "0")) {
        // The buffer was probably reset since the last read
        bufferHi = "";
      }

      const bufferLow = rawText.slice(0, thisStop);
      buffer = `${bufferHi}${bufferLow}`;
    }

    this.lastRead.push(thisStop);

    if (buffer.length > 0) {
      this.emitter.emit("buffer", toByteArray(buffer));
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

      // this.log.debug(`GET request to http://${host}:${port}${options.path}`);

      return new Promise((resolve, reject) => {
        request(options, (response) => {
          /*
          this.log.debug(
            `Response Code: ${response.statusCode}, ${response.statusMessage}`
          );
          */
          if (response.statusCode !== 200) {
            reject(response.statusMessage);
            return;
          }

          let data = "";

          response.on("data", (chunk) => {
            data += chunk;
          });

          response.on("end", () => {
            resolve({
              data,
            });
          });

          response.on("error", reject);
        }).end();
      });
    });
  }

  async send(message: InsteonRequest): Promise<{ data: string }> {
    const options = {
      path: `/3?${message.raw}=I=3`,
    };

    const result = await this.httpGet(options);

    // Schedule this 50ms after to allow the hub time
    // to get it's ducks in a row.
    // setTimeout(this.fetchBuf, 50);

    return result;
  }

  pipeEvents(emitter: EventEmitter): void {
    this.emitter = emitter;
  }
}
