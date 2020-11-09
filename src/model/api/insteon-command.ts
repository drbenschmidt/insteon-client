// eslint-disable-next-line import/prefer-default-export
export enum InsteonCommand {
  On = 0x11,
  OnFast = 0x12,
  Off = 0x13,
  OffFast = 0x14,
  Brighten = 0x15,
  Dim = 0x16,
  StatusRequest = 0x19,
  LightInstantChange = 0x21,
  ExtendedGetSet = 0x2e,
  LightOnRamp = 0x2e,
  LightOffRamp = 0x2f,
}
