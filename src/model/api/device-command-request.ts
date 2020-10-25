import { InsteonResponse } from "./response/insteon-response";
import DeviceCommand from "./device-command";
import DeviceCommandOptions from "./device-command-options";

export default class DeviceCommandRequest {
  success: boolean;

  _command: DeviceCommand;

  command: DeviceCommandOptions;

  ack: boolean;

  nack: boolean;

  callback: Function;

  response: InsteonResponse;

  constructor(command: DeviceCommand, callback: Function) {
    this._command = command;
    this.command = command.command;
    this.callback = callback;
  }
}
