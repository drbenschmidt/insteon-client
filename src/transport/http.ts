import { DeviceCommand } from '../model/device';
import { ITransport } from './itransport';
import { Agent, request } from 'http';
import Logger from '../utils/logger';
import { EventEmitter } from 'events';
import { ClientConfig } from '../model/config';

class AsyncLoop {
  private loopId: NodeJS.Timeout;
  private pollTimeoutMs: number;
  private emitter: EventEmitter;
  private log: Logger;
  private onTick: Function;

  constructor(pollTimeoutMs: number, log: Logger, onTick: Function) {
    this.pollTimeoutMs = pollTimeoutMs;
    this.log = new Logger('BufferLoop', log);
    this.onTick = onTick;
  }

  pipeEvents(emitter: EventEmitter) {
    this.emitter = emitter;
  }

  start() {
    if (this.loopId) {
      clearTimeout(this.loopId);
    }

    this.loopId = setTimeout(this.tick, this.pollTimeoutMs);
  }

  stop() {
    clearTimeout(this.loopId);
  }

  scheduleIn(timeoutMs: number) {
    this.log.debug(`forcing tick in ${timeoutMs}ms`);
    clearTimeout(this.loopId);

    this.loopId = setTimeout(this.tick, timeoutMs);
  }

  tick = async () => {
    this.log.debug('Tick Start');
    try {
      await this.onTick();
    } catch (e) {
      this.log.debug(`onTick error: ${e.message}`);
    } finally {
      this.start();
    }
  }
}

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
  private static log: Logger = new Logger('HTTP');
  private config: ClientConfig;
  private agent: Agent;
  private emitter: EventEmitter;
  private looper: AsyncLoop;
  private knownBufferPage: string = '';

  constructor(config: ClientConfig) {
    this.config = config;
    this.agent = new Agent({
      maxSockets: 1,  // Most important config: insteon hub does not like having tons of sockets
      keepAlive: true,
      keepAliveMsecs: 5000 // Be nice and give the socket back in 5sec.
    });
    this.looper = new AsyncLoop(5000, Http.log, this.fetchBuf);
  }

  open(): void {
    // Start event loop to keep checking for the buffer.
    Http.log.debug('Starting event buffer loop');
    this.looper.start();
  }

  close(): void {
    this.looper.stop();
  }

  fetchBuf = async () => {
    Http.log.debug('Fetching buffer');
    const { data } = await this.httpGet({
      path: '/buffstatus.xml'
    });

    // data looks like <response><BS>(202 characters of hex)</BS></response>
    // in lieu of using an XML parser adding another library dependency, we will
    // just use a bit of regex to parse it.
    let raw = /BS>([^<]+)<\/BS/g.exec(data)[1];
    Http.log.debug(`Raw response (length ${raw.length}): ${raw}`);
    if (raw.length === 202) {
      // The last 2 bytes are the length of 'good' data
      const length = parseInt(raw.substr(200), 16);
      raw = raw.substring(0, length);
    }
    let result = raw;
    if (this.knownBufferPage.length && raw.substring(0, this.knownBufferPage.length) === this.knownBufferPage) {
      result = raw.substr(this.knownBufferPage.length);
    }
    this.knownBufferPage = raw;
    if (result.length) {
      Http.log.debug(`good buffer: ${result}`);
      this.emitter.emit('buffer', result);
      // insteon.buffer += result;
      // insteon.checkStatus();
      // currentDelay = 100;
    } else {
      Http.log.debug(`bad buffer, result: ${result}`);
      Http.log.debug(`bad buffer, raw: ${raw}`);
    }

    if (raw.length > 30) {
      return this.clearBuffer();
    }
  };

  private async clearBuffer() {
    Http.log.debug('clearing buffer');

    await this.httpGet({
      path: '/1?XB=M=1',
    });
  }

  private httpGet(requestOptions: any): Promise<{ data: string; }> {
    const { host, port, user, pass } = this.config;
    const options = {
      hostname: host,
      port: port,
      agent: this.agent,
      auth: user + ':' + pass,
      path: '',
      ...requestOptions,
    };

    Http.log.debug(`Connecting to http://${host}:${port}/${options.path}`);

    return new Promise((resolve, reject) => {
      request(options, (res) => {
        Http.log.debug(`Response Code: ${res.statusCode}, ${res.statusMessage}`);
        if (res.statusCode !== 200) {
          reject(res.statusMessage);
          return;
        }

        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          Http.log.debug(`Recieved: ${data}`);
          resolve({
            data,
          });
        });

        res.on('error', reject)
      }).end();
    });
  }

  // TODO: message queueing
  // TODO: This path might need to be changed.
  async send(message: DeviceCommand): Promise<{ data: string; }> {
    const options = {
      path: '/3?' + message.raw + '=I=3',
    };

    const result = await this.httpGet(options);

    this.looper.scheduleIn(50);

    return result;
  }

  pipeEvents(emitter: EventEmitter): void {
    this.emitter = emitter;
    this.looper.pipeEvents(emitter);
  }
}
