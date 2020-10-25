import Client from '../../client';
import Logger from '../../utils/logger';
import DeviceCommand from "../api/device-command";
import LevelResponse from '../api/response/level-response';
import { formatLevel } from "../util";
import { DeviceBase } from "./device-base";

export default class Light extends DeviceBase {
  constructor(id: string, client: Client) {
    super(id, client);

    this.log = new Logger(`Light ${this.id.toRawString()}`, client.log);
  }

  async setLevel(value: number): Promise<void> {
    this.log.debug(`setLevel(${value})`);

    const command = new DeviceCommand(this.id, {
      cmd1: '21',
      cmd2: formatLevel(value),
    });

    await this.client.sendCommand(command);
  }

  async getLevel(): Promise<LevelResponse> {
    this.log.debug('getLevel');

    const command = new DeviceCommand(this.id, {
      cmd1: '19',
      exitOnAck: false, // There's another response we want.
    });

    const response = await this.client.sendCommand(command);

    return new LevelResponse(response);
  }
}