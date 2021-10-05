import InsteonId from "../../../model/api/insteon-id";
import { MessageId } from "../message-id";
import address from "./fields/address";
import flags, { Flags } from "./fields/flags";
import int from "./fields/int";
import message from "./message";
import { AbstractMessage } from "./types";

interface StandardReceivedMessage extends AbstractMessage {
  address: InsteonId;
  target: InsteonId;
  flags: Flags;
  cmd1: number;
  cmd2: number;
}

export const standardReceivedMessage = message<StandardReceivedMessage>(
  MessageId.STANDARD_RECEIVED,
  address("address"),
  address("target"),
  flags("flags"),
  int("cmd1"),
  int("cmd2")
);

export default standardReceivedMessage;
