import type Client from "../../client";
import Logger from "../../utils/logger";
import DeviceCommand from "../api/device-command";
import InsteonId from "../api/insteon-id";
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
    const command = new DeviceCommand(this.id, {
      cmd1: "30",
    });

    await this.client.sendCommand(command);
  }
}
