import { DeviceCommand } from '../model/device';
import { ITransport } from './itransport';
import { Agent, request } from 'http';
import Logger from '../utils/logger';

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
  private agent: Agent;
  private host: string;
  private port: number;
  private username: string;
  private password: string;

  constructor() {
    this.agent = new Agent({
      maxSockets: 1,  // Most important config: insteon hub does not like having tons of sockets
      keepAlive: true,
      keepAliveMsecs: 5000 // Be nice and give the socket back in 5sec.
    });
  }

  open(): void {
    // Start event loop to keep checking for the buffer.
    throw new Error('Method not implemented.');
  }

  close(): void {
    throw new Error('Method not implemented.');
  }

  // TODO: message queueing
  // TODO: This path might need to be changed.
  send(message: DeviceCommand): Promise<{ data: string; }> {
    return new Promise<{ data: string; }>((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: '/3?' + message.raw + '=I=3',
        agent: this.agent,
        auth: this.username + ':' + this.password,
      };

      Http.log.debug(`Connecting to http://${this.host}:${this.port}/3?${message.raw}=I=3`);
  
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
          resolve({
            data,
          });
        });

        res.on('error', reject)
      }).end();
    });
  }

  init(host: string, port: number, username: string, password: string): void {
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
  }
}
