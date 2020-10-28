import type Client from "../../client";
import Logger from "../../utils/logger";
import { buildDeviceCommand } from "../api/insteon-message";
import LevelResponse from "../api/response/level-response";
import { formatLevel } from "../util";
import DeviceBase from "./device-base";

export default class Light extends DeviceBase {
  constructor(id: string, client: Client) {
    super(id, client);

    this.log = new Logger(`Light ${this.id.toRawString()}`, client.log);
  }

  async setLevel(value: number): Promise<void> {
    this.log.debug(`setLevel(${value})`);

    const request = buildDeviceCommand({
      destinationId: this.id,
      command1: "21",
      command2: formatLevel(value),
    });

    await this.client.sendCommand(request);
  }

  async getLevel(): Promise<LevelResponse> {
    this.log.debug("getLevel");

    const request = buildDeviceCommand({
      destinationId: this.id,
      command1: "19",
      exitOnAck: false, // There's another response we want.
    });

    const response = await this.client.sendCommand(request);

    return new LevelResponse(response);
  }
}
