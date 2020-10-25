import { genCrc, toHex } from "../util";
import DeviceCommandOptions from "./device-command-options";
import InsteonId from "./insteon-id";

export default class DeviceCommand {
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
        userData = userData.substring(0, pad.length - 2) + toHex(checksum);
      }
    }

    // TODO: Set cmd2 default to 00 properly
    this.raw = `02${type}${this.destinationId}${flags}${cmd.cmd1}${cmd.cmd2 ?? '00'}${userData}`;
    this.command = cmd;
    this.command.raw = this.raw;
  }
}
