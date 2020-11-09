/* eslint-disable no-plusplus */
/* eslint-disable no-bitwise */

import InsteonId from "../../model/api/insteon-id";
import { InsteonMessage } from "../../model/api/insteon-message";

const { parseInt } = Number;

// ex: "025156219352C4EC112E000101000020201FFE1F0000000000"
//
// 02 - idk
// 51 - type
// 562193 - device id
// 52C4EC - gateway id
// 1 - type flag
// 1 - hops flag
// 2E - command1
// 00 - command2
// 0101000020201FFE1F0000000000

export default function parseMessageReceived(_raw: string): InsteonMessage {
  let raw = _raw;
  const type = raw.slice(2, 4);

  if (type !== "51" && type !== "50") {
    return;
  }

  const id = new InsteonId(raw.slice(4, 10));
  const gatewayId = raw.slice(10, 16);
  const typeFlag = parseInt(raw.slice(16, 17), 16);
  const extended = type === "51"; // typeFlag & 1 !== 0; // bit mask 0001
  const messageType = typeFlag >> 1;
  const hopFlag = parseInt(raw.slice(17, 18), 16);
  const hopsLeft = hopFlag >> 2;
  const maxHops = hopFlag & 3; // bit mask 0011
  const command1 = raw.slice(18, 20);
  const command2 = raw.slice(20, 22);
  const userData: Array<string> = [];

  if (extended) {
    // console.log('userDataRaw', raw.slice(22));
    for (let index = 0; index < 14; index++) {
      const start = 22 + index * 2;
      const data = raw.slice(start, start + 2);
      // console.log('userDataRaw - data', data);
      userData.push(data);
    }
    raw = raw.slice(0, Math.max(0, 25 * 2));
  } else {
    raw = raw.slice(0, Math.max(0, 11 * 2));
  }

  // eslint-disable-next-line consistent-return
  return {
    type,
    id,
    gatewayId,
    extended,
    messageType,
    hopsLeft,
    maxHops,
    command1,
    command2,
    userData,
  } as InsteonMessage;
}
