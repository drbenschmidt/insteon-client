import type Client from "../../client";
import Logger from "../../utils/logger";
import InsteonId from "../api/insteon-id";
import { buildDeviceCommand } from "../api/insteon-message";
import { IDevice } from "./idevice";

export default abstract class DeviceBase implements IDevice {
  client: Client;

  id: InsteonId;

  log: Logger;

  constructor(id: string, client: Client) {
    this.id = new InsteonId(id);
    this.client = client;
  }

  getInfo(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async beep(): Promise<void> {
    this.log.debug("Attempting Beep");

    const request = buildDeviceCommand({
      destinationId: this.id,
      command1: "30",
    });

    await this.client.sendCommand(request);
  }
}
