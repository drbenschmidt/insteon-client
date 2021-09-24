// eslint-disable-next-line import/prefer-default-export
export enum MessageId {
  STANDARD_RECEIVED = 0x50,
  EXTENDED_RECEIVED = 0x51,
  X10_RECEIVED = 0x52,
  ALL_LINKING_COMPLETED = 0x53,
  BUTTON_EVENT_REPORT = 0x54,
  USER_RESET_DETECTED = 0x55,
  ALL_LINK_CLEANUP_FAILURE_REPORT = 0x56,
  ALL_LINK_RECORD_RESPONSE = 0x57,
  ALL_LINK_CLEANUP_STATUS_REPORT = 0x58,
  GET_IM_INFO = 0x60,
  SEND_ALL_LINK_COMMAND = 0x61,
  SEND_STANDARD = 0x62,
  SEND_EXTENDED = 0x62,
  X10_SEND = 0x63,
  START_ALL_LINKING = 0x64,
  CANCEL_ALL_LINKING = 0x65,
  SET_HOST_DEV_CAT = 0x66,
  RESET_IM = 0x67,
  SET_ACK_MESSAGE_BYTE = 0x68,
  GET_FIRST_ALL_LINK_RECORD = 0x69,
  GET_NEXT_ALL_LINK_RECORD = 0x6a,
  SET_IM_CONFIGURATION = 0x6b,
  GET_ALL_LINK_RECORD_FOR_SENDER = 0x6c,
  LED_ON = 0x6d,
  LED_OFF = 0x6e,
  MANAGE_ALL_LINK_RECORD = 0x6f,
  SET_NAK_MESSAGE_BYTE = 0x70,
  SET_ACK_MESSAGE_TWO_BYTES = 0x71,
  RF_SLEEP = 0x72,
  GET_IM_CONFIGURATION = 0x73,
}