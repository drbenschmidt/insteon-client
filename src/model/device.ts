import Client from '../client';

export function toByte(value: number, length = 1) {
  const byteValue = value.toString(16).toUpperCase();
  const pad = new Array((length * 2) + 1).join('0');
  return pad.substring(0, pad.length - byteValue.length) + value;
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

export type DeviceCommandOptions = {
  type: string;
  extended: boolean;
  userData: Array<unknown>;
  cmd1: string;
  cmd2: string;
  crc: unknown;
  checksum: unknown;
}

export class DeviceCommand {
  raw: string;
  destinationId: InsteonId;

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

  constructor(id: string) {
    const processed = id.trim().replace(/\./g, '');
    if (!INSTEON_ID_REGEX.test(processed)) {
      throw new Error(`Invalid Insteon ID: ${id} (${processed})`);
    }
    this.value = processed;
  }

  toString() {
    return this.value;
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

  constructor(id: string, client: Client) {
    this.id = new InsteonId(id);
    this.client = client;
  }

  getInfo(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  beep(): Promise<void> {
    const command = new DeviceCommand(this.id, {
      cmd1: '30',
      cmd2: '00',
      extended: false,
      type: '',
      userData: [],
      crc: null,
      checksum: null,
    });

    return this.client.sendCommand(command);
  }
}

export class Light extends GenericDevice {

}