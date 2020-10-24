export const formatLevel = (level: number) => toHex(scaleUp(255, clamp(0, 100, level)), 2);
export const scaleUp = (max: number, percentage: number) => ~~(max * percentage / 100);
export const clamp = (min: number, max: number, val: number) => Math.min(Math.max(val, min), max);
export const toHex = (value: number, length = 1) => value.toString(16).toUpperCase().padStart(length, '0');

export function genCrc(cmd: string) {
  let crc = 0;
  cmd.substring(0, 28).match(/.{1,2}/g).forEach(function (input) {
    let byte = parseInt(input, 16);
    for (let bit = 0; bit < 8; bit++) {
      let fb = byte & 1;
      fb = (crc & 0x8000) ? fb ^ 1 : fb;
      fb = (crc & 0x4000) ? fb ^ 1 : fb;
      fb = (crc & 0x1000) ? fb ^ 1 : fb;
      fb = (crc & 0x0008) ? fb ^ 1 : fb;
      crc = (crc << 1) & 0xFFFF | fb;
      byte = byte >> 1;
    }
  });
  return toHex(crc, 2);
}
