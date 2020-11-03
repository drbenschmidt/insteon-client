import type Client from "../../client";
import Logger from "../../utils/logger";
import { buildDeviceCommand } from "../api/insteon-message";
import LevelResponse from "../api/response/level-response";
import {
  formatLevel,
  byteToRampRate,
  byteToLevel,
  toHex,
  rampRateToHexHalfByte,
  levelToHexHalfByte,
} from "../util";
import DeviceBase from "./device-base";

const { parseInt } = Number;

export type LightInfoResponse = {
  rampRate: number;
  onLevel: number;
  ledBrightness: number;
};

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

  async brighten(): Promise<void> {
    this.log.debug("brighten");

    const request = buildDeviceCommand({
      destinationId: this.id,
      command1: "15",
    });

    await this.client.sendCommand(request);
  }

  async dim(): Promise<void> {
    this.log.debug("dim");

    const request = buildDeviceCommand({
      destinationId: this.id,
      command1: "16",
    });

    await this.client.sendCommand(request);
  }

  async getInfo(): Promise<LightInfoResponse> {
    this.log.info("getInfo");

    const request = buildDeviceCommand({
      destinationId: this.id,
      command1: "2E",
      command2: "00",
      extended: true,
      userData: [toHex(1)],
    });

    const result = await this.client.sendCommand(request);

    this.log.debug("getInfo - result", result);

    const rampRate = byteToRampRate(result.extended.userData[6] as string);
    const onLevel = byteToLevel(result.extended.userData[7] as string);
    const ledBrightness = parseInt(result.extended.userData[8] as string, 16);

    return {
      rampRate,
      onLevel,
      ledBrightness,
    };
  }

  /**
   * @deprecated Because I can't get it to work.
   */
  async turnOn(rate = "fast", level = 100): Promise<void> {
    let rampRate = 100;

    // eslint-disable-next-line default-case
    switch (rate) {
      case "test":
        rampRate = 8500;
        break;
      case "slow":
        rampRate = 47000; // 47 sec in msec
        break;
      case "fast":
        rampRate = 100; // .1 sec in msec
        break;
    }

    const rampAndLevel = `${levelToHexHalfByte(level)}${rampRateToHexHalfByte(
      rampRate
    )}`;

    const request = buildDeviceCommand({
      destinationId: this.id,
      command1: "2E",
      command2: rampAndLevel,
    });

    await this.client.sendCommand(request);
  }

  /**
   * @deprecated Because I can't get it to work.
   */
  async turnOff(rate = "fast"): Promise<void> {
    let rampRate = 100;

    // eslint-disable-next-line default-case
    switch (rate) {
      case "test":
        rampRate = 8500;
        break;
      case "slow":
        rampRate = 47000; // 47 sec in msec
        break;
      case "fast":
        rampRate = 100; // .1 sec in msec
        break;
    }

    const rampAndLevel = `0${rampRateToHexHalfByte(rampRate)}`;

    const request = buildDeviceCommand({
      destinationId: this.id,
      command1: "2F",
      command2: rampAndLevel,
    });

    await this.client.sendCommand(request);
  }

  async turnOffFast(): Promise<void> {
    const request = buildDeviceCommand({
      destinationId: this.id,
      command1: "14",
    });

    await this.client.sendCommand(request);
  }

  async turnOnFast(): Promise<void> {
    const request = buildDeviceCommand({
      destinationId: this.id,
      command1: "12",
    });

    await this.client.sendCommand(request);
  }
}
