interface InsteonResponseStandard {
  command2: string;
}

export interface InsteonResponse {
  standard?: InsteonResponseStandard | Array<InsteonResponseStandard>;
  extended?: unknown;
}
