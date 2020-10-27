import InsteonId from "./insteon-id";

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
  type?: string;

  extended?: boolean;

  userData?: Array<unknown>;

  command1: string;

  command2?: string;

  crc?: string;

  checksum?: number;

  raw?: string; // TODO: UGLY.

  exitOnAck?: boolean;
};
