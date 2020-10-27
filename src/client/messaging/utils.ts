/* eslint-disable no-plusplus */
/* eslint-disable no-bitwise */

import InsteonId from "../../model/api/insteon-id";
import { InsteonMessage } from "../../model/api/insteon-message";

const { parseInt } = Number;

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

  if (extended) {
    const userData = [];

    for (let index = 0; index < 14; index++) {
      userData.push(raw.slice(22 + index * 2, 2));
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
  } as InsteonMessage;
}
