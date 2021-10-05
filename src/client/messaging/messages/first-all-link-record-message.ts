import { MessageId } from "../message-id";
import int from "./fields/int";
import message from "./message";
import { AbstractMessage } from "./types";

export interface FirstAllLinkRecordMessage extends AbstractMessage {
  ack: number;
}

export const firstAllLinkRecordMessage = message<FirstAllLinkRecordMessage>(
  MessageId.GET_FIRST_ALL_LINK_RECORD,
  int("ack")
);
