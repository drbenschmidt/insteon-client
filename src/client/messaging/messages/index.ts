import { allLinkRecordResponseMessage } from "./all-link-record-response";
import { firstAllLinkRecordMessage } from "./first-all-link-record-message";
import { nextAllLinkRecordMessage } from "./next-all-link-record-message";
import { sendAllLinkMessage } from "./send-all-link-message";
import { sendExtendedMessage } from "./send-extended-message";
import { standardReceivedMessage } from "./standard-received";

// Types
export type { AbstractMessage } from "./types";
export type { MessageBuilder } from "./message";
export type { NextAllLinkRecordMessage } from "./next-all-link-record-message";
export type { AllLinkRecordResponseMessage } from "./all-link-record-response";

// Classes
export { Flags } from "./fields/flags";

export const messages = {
  allLinkRecordResponseMessage,
  firstAllLinkRecordMessage,
  nextAllLinkRecordMessage,
  sendAllLinkMessage,
  sendExtendedMessage,
  standardReceivedMessage,
};
