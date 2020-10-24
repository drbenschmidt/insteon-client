import Client from '../client';
import Logger from '../utils/logger';

export function levelToHexByte(level: number) {
  if (level < 0 || level > 100) {
    throw new Error('level must be between 0 and 100');
  }
  // scale level to a max of 0xFF (255)
  level = ~~ (255 * level / 100);

  return toByte(level);
}

export function toByte(value: number, length = 1) {
  return value.toString(16).toUpperCase().padStart(length, '0');
}

export function genCrc(cmd: string) {
  let crc = 0;
  cmd.substring(0, 28).match(/.{1,2}/g).forEach(function (input) {
    let byte = parseInt(input, 16);
    for (let bit = 0; bit < 8; bit++) {
      let fb = byte & 1;
      fb = (crc & 0x8000) ? fb ^ 1 : fb;
      fb = (crc & 0x4000) ? fb ^ 1 : fb;
      fb = (crc & 0x1000) ? fb ^ 1 : fb;
      fb = (crc & 0x0008) ? fb ^ 1 : fb;
      crc = (crc << 1) & 0xFFFF | fb;
      byte = byte >> 1;
    }
  });
  return toByte(crc, 2);
}

export class DeviceCommandRequest {
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

export type DeviceCommandOptions = {
  type: string;
  extended: boolean;
  userData: Array<unknown>;
  cmd1: string;
  cmd2: string;
  crc: unknown;
  checksum: unknown;
  raw?: string; // TODO: UGLY.
  exitOnAck: boolean;
}

export class DeviceCommand {
  raw: string;
  destinationId: InsteonId;
  command: DeviceCommandOptions;

  constructor(destinationId: InsteonId, cmd: DeviceCommandOptions) {
    this.destinationId = destinationId;

    const type = cmd.type = '62';
    let userData = '';
    let flags = '0F'; // standard command
    if (cmd.extended) {
      flags = '1F';
      const pad = '0000000000000000000000000000';
      userData = (cmd.userData ? cmd.userData.join('') : '');
      userData = userData.substring(0, pad.length);
      userData = userData + pad.substring(0, pad.length - userData.length);

      // create checksum for i2cs devices
      const fullCmd = cmd.cmd1 + cmd.cmd2 + userData;
      if (cmd.crc) {
        userData = userData.substring(0, pad.length - 4) + genCrc(fullCmd);
      } else {
        var checksum = 0;
        fullCmd.match(/.{1,2}/g).forEach(function (b) {
          checksum += parseInt(b, 16);
        });

        checksum = ((~checksum) + 1) & 255;
        cmd.checksum = checksum;
        userData = userData.substring(0, pad.length - 2) + toByte(checksum);
      }
    }

    this.raw = `02${type}${this.destinationId}${flags}${cmd.cmd1}${cmd.cmd2}${userData}`;
    this.command = cmd;
    this.command.raw = this.raw;
  }
}

export class DeviceMessage {
  destinationId: InsteonId;

  toHex() {
    return '';
  }
}

const INSTEON_ID_REGEX = /^[0-9a-fA-F]{6}$/;
export class InsteonId {
  private value: string;
  private raw: string;

  constructor(id: string) {
    const processed = id.trim().replace(/\./g, '');
    if (!INSTEON_ID_REGEX.test(processed)) {
      throw new Error(`Invalid Insteon ID: ${id} (${processed})`);
    }
    this.value = processed;
    this.raw = id;
  }

  toString() {
    return this.value;
  }
  
  toRawString() {
    return this.raw;
  }
}

export interface IDevice {
  id: InsteonId;
  client: Client;

  getInfo(): Promise<void>;
  beep(): Promise<void>;
}

export class GenericDevice implements IDevice {
  client: Client;
  id: InsteonId;
  log: Logger;

  constructor(id: string, client: Client) {
    this.id = new InsteonId(id);
    this.client = client;
  }

  getInfo(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async beep(): Promise<void> {
    this.log.debug('Attempting Beep');
    const command = new DeviceCommand(this.id, {
      cmd1: '30',
      cmd2: '00',
      extended: false,
      type: '',
      userData: [],
      crc: null,
      checksum: null,
      exitOnAck: true,
    });

    await this.client.sendCommand(command);
  }
}

interface InsteonResponseStandard {
  command2: string;
}

export interface InsteonResponse {
  standard: InsteonResponseStandard;
}

class LevelResponse {
  level: number;

  constructor(response: InsteonResponse) {
    this.level = Math.ceil(parseInt(response.standard.command2, 16) * 100 / 255);
  }
}

export class Light extends GenericDevice {
  constructor(id: string, client: Client) {
    super(id, client);

    this.log = new Logger(`Light ${this.id.toRawString()}`, Client.log);
  }

  async setLevel(value: number): Promise<void> {
    this.log.debug(`setLevel(${value})`);

    const command = new DeviceCommand(this.id, {
      cmd1: '21',
      cmd2: levelToHexByte(value),
      extended: false,
      type: '',
      userData: [],
      crc: null,
      checksum: null,
      exitOnAck: true,
    });

    await this.client.sendCommand(command);
  }

  async getLevel(): Promise<LevelResponse> {
    this.log.debug('getLevel');

    const command = new DeviceCommand(this.id, {
      cmd1: '19',
      cmd2: '00',
      extended: false,
      type: '',
      userData: [],
      crc: null,
      checksum: null,
      exitOnAck: false, // There's another response we want.
    });

    const response = await this.client.sendCommand(command);

    return new LevelResponse(response);
  }
}
