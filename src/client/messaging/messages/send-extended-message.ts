import InsteonId from "../../../model/api/insteon-id";
import { MessageId } from "../message-id";
import address from "./fields/address";
import flags, { Flags } from "./fields/flags";
import int from "./fields/int";
import userData, { UserData } from "./fields/user-data";
import message from "./message";
import { AbstractMessage } from "./types";

interface ExtendedMessage extends AbstractMessage {
  address: InsteonId;
  flags: Flags;
  cmd1: number;
  cmd2: number;
  userData?: UserData;
}

const extendedMessageFields = [
  address("address"),
  flags("flags"),
  int("cmd1"),
  int("cmd2"),
];

// This message is extendable, but this is the standard message, so don't mark it as extended.
export const sendExtendedMessage = message<ExtendedMessage>(
  MessageId.SEND_EXTENDED,
  ...extendedMessageFields
);
sendExtendedMessage.isExtendable = true;
sendExtendedMessage.isExtended = false;

export const sendExtendedMessageExtended = message<ExtendedMessage>(
  MessageId.SEND_EXTENDED,
  ...extendedMessageFields,
  userData("userData")
);
sendExtendedMessageExtended.isExtendable = true;
sendExtendedMessageExtended.isExtended = true;
