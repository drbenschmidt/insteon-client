const { parseInt } = Number;
const { ceil, trunc } = Math;

export const scaleUp = (max: number, percentage: number): number =>
  trunc((max * percentage) / 100);

export const clamp = (min: number, max: number, value: number): number =>
  Math.min(Math.max(value, min), max);

export const toHex = (value: number, length = 1): string =>
  value.toString(16).toUpperCase().padStart(length, "0");

export const fromHex = (value: string): number => parseInt(value, 16);

export const formatLevel = (level: number): string =>
  toHex(scaleUp(255, clamp(0, 100, level)), 2);

export const byteToLevel = (byte: string): number =>
  ceil((parseInt(byte, 16) * 100) / 255);

export function genCrc(cmd: string) {
  let crc = 0;
  cmd
    .slice(0, 28)
    .match(/.{1,2}/g)
    .forEach(function (input) {
      let byte = Number.parseInt(input, 16);
      for (let bit = 0; bit < 8; bit++) {
        let fb = byte & 1;
        fb = crc & 0x8000 ? fb ^ 1 : fb;
        fb = crc & 0x4000 ? fb ^ 1 : fb;
        fb = crc & 0x1000 ? fb ^ 1 : fb;
        fb = crc & 0x0008 ? fb ^ 1 : fb;
        crc = ((crc << 1) & 0xffff) | fb;
        byte >>= 1;
      }
    });
  return toHex(crc, 2);
}

const RAMP_RATES = [
  2000, // shouldn't be used
  480000,
  420000,
  360000,
  300000,
  270000,
  240000,
  210000,
  180000,
  150000,
  120000,
  90000,
  60000,
  47000,
  43000,
  38500,
  34000,
  32000,
  30000,
  28000,
  26000,
  23500,
  21500,
  19000,
  8500,
  6500,
  4500,
  2000,
  500,
  300,
  200,
  100,
];

export function lookupRampRateIndex(rate: number): number {
  // eslint-disable-next-line no-plusplus
  for (let index = 1; index < RAMP_RATES.length; index++) {
    if (rate >= RAMP_RATES[index]) {
      return index;
    }
  }

  return RAMP_RATES.length - 1;
}

export function byteToRampRate(byte: string): number {
  return RAMP_RATES[parseInt(byte, 16)];
}

export const rampRateToHexHalfByte = (rate: number): string =>
  trunc(lookupRampRateIndex(rate) / 2)
    .toString(16)
    .toUpperCase();

export const levelToHexHalfByte = (level: number): string => {
  // scale level to a max of 0xF (15)
  const mathed = trunc((15 * clamp(0, 100, level)) / 100);

  return mathed.toString(16).toUpperCase();
};

export const levelToHexByte = (level: number): string =>
  toHex(trunc((255 * clamp(0, 100, level)) / 100));

export const sum = (numbers: number[]): number =>
  numbers.reduce((prev, curr) => prev + curr, 0);

export const toByteArray = (raw: string): number[] =>
  raw
    .split("")
    .map((_, index, array) =>
      !(index % 2) ? `${array[index]}${array[index + 1]}` : undefined
    )
    .filter((a) => a)
    .map((value) => fromHex(value));
