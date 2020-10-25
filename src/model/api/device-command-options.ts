export default class DeviceCommandOptions {
  type?: string;

  extended?: boolean = false;

  userData?: Array<unknown>;

  cmd1 = "00";

  cmd2?: string = "00";

  crc?: string;

  checksum?: number;

  raw?: string; // TODO: UGLY.

  exitOnAck?: boolean = true;
}
