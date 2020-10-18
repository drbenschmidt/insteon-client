import { DeviceCommand } from '../model/device';
import { ITransport } from './itransport';
import { Agent, request } from 'http';
import Logger from '../utils/logger';
import { EventEmitter } from 'events';
import { ClientConfig } from '../model/config';

class BufferLoop {
  private loopId: NodeJS.Timeout;
  private pollTimeoutMs: number;
  private emitter: EventEmitter;
  private log: Logger;

  constructor(pollTimeoutMs: number, log: Logger) {
    this.pollTimeoutMs = pollTimeoutMs;
    this.log = new Logger('BufferLoop', log);
  }

  pipeEvents(emitter: EventEmitter) {
    this.emitter = emitter;
  }

  start() {
    if (this.loopId) {
      clearTimeout(this.loopId);
    }

    this.loopId = setTimeout(this.tick.bind(this), this.pollTimeoutMs);
  }

  stop() {
    clearTimeout(this.loopId);
  }

  tick() {
    this.log.debug('Tick Start');
    this.emitter.emit('tick');
    this.start();
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
  private looper: BufferLoop;

  constructor(config: ClientConfig) {
    this.config = config;
    this.agent = new Agent({
      maxSockets: 1,  // Most important config: insteon hub does not like having tons of sockets
      keepAlive: true,
      keepAliveMsecs: 5000 // Be nice and give the socket back in 5sec.
    });
    this.looper = new BufferLoop(5000, Http.log);
  }

  open(): void {
    // Start event loop to keep checking for the buffer.
    Http.log.debug('Starting event buffer loop');
    this.looper.start();
  }

  close(): void {
    this.looper.stop();
  }

  // TODO: message queueing
  // TODO: This path might need to be changed.
  send(message: DeviceCommand): Promise<{ data: string; }> {
    return new Promise<{ data: string; }>((resolve, reject) => {
      const { host, port, user, pass } = this.config;
      const options = {
        hostname: host,
        port: port,
        path: '/3?' + message.raw + '=I=3',
        agent: this.agent,
        auth: user + ':' + pass,
      };

      Http.log.debug(`Connecting to http://${host}:${port}/3?${message.raw}=I=3`);
  
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

  pipeEvents(emitter: EventEmitter): void {
    this.emitter = emitter;
    this.looper.pipeEvents(emitter);
  }
}
