export default class DeviceCommandOptions {
  type?: string;

  extended?: boolean = false;

  userData?: Array<unknown>;

  cmd1 = "00";

  cmd2?: string = "00";

  crc?: string;

  checksum?: number;

  raw?: string;

  exitOnAck?: boolean = true;

  responseCount?: number;

  isStandardResponse?: boolean;

  waitForExtended?: boolean;

  waitForLinking?: boolean;
}
