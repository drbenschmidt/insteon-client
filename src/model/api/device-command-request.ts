import { InsteonResponse } from "./response/insteon-response";
import DeviceCommand from "./device-command";
import DeviceCommandOptions from "./device-command-options";
import InsteonId from "./insteon-id";
import { InsteonRequest } from "./insteon-message";

export type DeviceCommandRequestCallback = (
  request: DeviceCommandRequest
) => void;

export default class DeviceCommandRequest {
  success: boolean;

  command: DeviceCommandOptions;

  request: InsteonRequest;

  ack: boolean;

  nack: boolean;

  callback: DeviceCommandRequestCallback;

  response: InsteonResponse;

  destinationId: InsteonId;

  constructor(command: DeviceCommand, callback: DeviceCommandRequestCallback) {
    this.destinationId = command.destinationId;
    this.command = command.command;
    this.callback = callback;

    this.request = {
      destinationId: this.destinationId,
      type: this.command.type,
      extended: this.command.extended,
      userData: this.command.userData,
      command1: this.command.cmd1,
      command2: this.command.cmd2,
      crc: this.command.crc,
      checksum: this.command.checksum,
      raw: this.command.raw,
      exitOnAck: this.command.exitOnAck,
    };
  }
}
