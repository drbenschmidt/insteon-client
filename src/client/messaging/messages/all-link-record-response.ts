import InsteonId from "../../../model/api/insteon-id";
import { MessageId } from "../message-id";
import address from "./fields/address";
import allLinkRecordFlags, {
  AllLinkRecordFlags,
} from "./fields/all-link-record-flags";
import int from "./fields/int";
import message from "./message";
import { AbstractMessage } from "./types";

export interface AllLinkRecordResponseMessage extends AbstractMessage {
  flags: AllLinkRecordFlags;
  group: number;
  target: InsteonId;
  data1: number;
  data2: number;
  data3: number;
}

export const allLinkRecordResponseMessage = message<
  AllLinkRecordResponseMessage
>(
  MessageId.ALL_LINK_RECORD_RESPONSE,
  allLinkRecordFlags("flags"),
  int("group"),
  address("target"),
  int("data1"),
  int("data2"),
  int("data3")
);
