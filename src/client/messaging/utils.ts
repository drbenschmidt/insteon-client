export function parseMessageReceived(raw: string) {
  const cmd: any = {};
  cmd.type = raw.slice(2, 4);
  if (cmd.type !== "51" && cmd.type !== "50") {
    return null;
  }
  cmd.id = raw.slice(4, 10);
  cmd.gatewayId = raw.slice(10, 16);
  const typeFlag = Number.parseInt(raw.slice(16, 17), 16);
  cmd.extended = cmd.type === "51"; // typeFlag & 1 !== 0; // bit mask 0001
  cmd.messageType = typeFlag >> 1;
  const hopFlag = Number.parseInt(raw.slice(17, 18), 16);
  cmd.hopsLeft = hopFlag >> 2;
  cmd.maxHops = hopFlag & 3; // bit mask 0011
  cmd.command1 = raw.slice(18, 20);
  cmd.command2 = raw.slice(20, 22);

  if (cmd.extended) {
    cmd.userData = [];
    for (let index = 0; index < 14; index++) {
      cmd.userData.push(raw.substr(22 + index * 2, 2));
    }
    cmd.raw = raw.slice(0, Math.max(0, 25 * 2));
  } else {
    cmd.raw = raw.slice(0, Math.max(0, 11 * 2));
  }
  return cmd;
}
