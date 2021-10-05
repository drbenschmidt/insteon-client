import { MessageId } from "../message-id";
import int from "./fields/int";
import { UserData } from "./fields/user-data";
import message from "./message";
import { AbstractMessage } from "./types";

interface SendAllLinkMessage extends AbstractMessage {
  group: number;
  cmd1: number;
  cmd2: number;
  ack: number;
  userData: UserData;
}

export const sendAllLinkMessage = message<SendAllLinkMessage>(
  MessageId.SEND_ALL_LINK_COMMAND,
  int("group"),
  int("cmd1"),
  int("cmd2"),
  int("ack")
);

export default sendAllLinkMessage;
