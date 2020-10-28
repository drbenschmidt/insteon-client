import { genCrc, toHex } from "../util";
import InsteonId from "./insteon-id";

const { assign, create } = Object;

export type InsteonMessage = {
  type: string;
  id: InsteonId;
  gatewayId: string;
  extended: boolean;
  messageType: number;
  hopsLeft: number;
  maxHops: number;
  command1: string;
  command2: string;
};

export type InsteonRequest = {
  destinationId: InsteonId;
  type?: string;
  extended?: boolean;
  userData?: Array<unknown>;
  command1: string;
  command2?: string;
  crc?: string;
  checksum?: number;
  raw?: string;
  exitOnAck?: boolean;
  responseCount?: number;
  isStandardResponse?: boolean;
  waitForExtended?: boolean;
  waitForLinking?: boolean;
};

export const buildDeviceCommand = (request: InsteonRequest): InsteonRequest => {
  const type = "62";
  let userData = "";
  let flags = "0F"; // standard command
  let checksum = 0;

  if (request.extended) {
    flags = "1F";
    const pad = "0000000000000000000000000000";
    userData = request.userData ? request.userData.join("") : "";
    userData = userData.slice(0, Math.max(0, pad.length));
    userData += pad.slice(0, Math.max(0, pad.length - userData.length));

    // create checksum for i2cs devices
    const fullCmd = request.command1 + request.command2 + userData;
    if (request.crc) {
      userData =
        userData.slice(0, Math.max(0, pad.length - 4)) + genCrc(fullCmd);
    } else {
      fullCmd.match(/.{1,2}/g).forEach((b) => {
        checksum += Number.parseInt(b, 16);
      });

      // eslint-disable-next-line no-bitwise
      checksum = (~checksum + 1) & 255;
      userData =
        userData.slice(0, Math.max(0, pad.length - 2)) + toHex(checksum);
    }
  }

  const raw = `02${type}${request.destinationId}${flags}${request.command1}${
    request.command2 ?? "00"
  }${userData}`;

  // eslint-disable-next-line unicorn/no-null
  return assign(create(null), request, {
    type,
    userData,
    flags,
    checksum,
    raw,
  });
};
