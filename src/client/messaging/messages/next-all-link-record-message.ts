import { MessageId } from "../message-id";
import int from "./fields/int";
import message from "./message";
import { AbstractMessage } from "./types";

export interface NextAllLinkRecordMessage extends AbstractMessage {
  ack: number;
}

export const nextAllLinkRecordMessage = message<NextAllLinkRecordMessage>(
  MessageId.GET_NEXT_ALL_LINK_RECORD,
  int("ack")
);
