import { InsteonResponse } from "./response/insteon-response";
import DeviceCommand from "./device-command";
import DeviceCommandOptions from "./device-command-options";
import InsteonId from "./insteon-id";

export type DeviceCommandRequestCallback = (
  request: DeviceCommandRequest
) => void;

export default class DeviceCommandRequest {
  success: boolean;

  command: DeviceCommandOptions;

  ack: boolean;

  nack: boolean;

  callback: DeviceCommandRequestCallback;

  response: InsteonResponse;

  destinationId: InsteonId;

  constructor(command: DeviceCommand, callback: DeviceCommandRequestCallback) {
    this.destinationId = command.destinationId;
    this.command = command.command;
    this.callback = callback;
  }
}
