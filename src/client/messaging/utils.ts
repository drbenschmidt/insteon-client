export function parseMessageReceived(raw: string) {
  var cmd: any = {};
  cmd.type = raw.substr(2, 2);
  if (cmd.type !== '51' && cmd.type !== '50') {
    return null;
  }
  cmd.id = raw.substr(4, 6);
  cmd.gatewayId = raw.substr(10, 6);
  var typeFlag = parseInt(raw.substr(16, 1), 16);
  cmd.extended = cmd.type === '51'; // typeFlag & 1 !== 0; // bit mask 0001
  cmd.messageType = typeFlag >> 1;
  var hopFlag = parseInt(raw.substr(17, 1), 16);
  cmd.hopsLeft = hopFlag >> 2;
  cmd.maxHops = hopFlag & 3; // bit mask 0011
  cmd.command1 = raw.substr(18, 2);
  cmd.command2 = raw.substr(20, 2);

  if (cmd.extended) {
    cmd.userData = [];
    for (var i = 0; i < 14; i++) {
      cmd.userData.push(raw.substr(22 + (i * 2), 2));
    }
    cmd.raw = raw.substr(0, (25 * 2));
  } else {
    cmd.raw = raw.substr(0, (11 * 2));
  }
  return cmd;
}