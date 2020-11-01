interface InsteonResponseStandard {
  command2: string;
}

interface InsteonResponseExtended {
  userData: Array<unknown>;
}

export interface InsteonResponse {
  standard?: InsteonResponseStandard | Array<InsteonResponseStandard>;
  extended?: InsteonResponseExtended;
}
