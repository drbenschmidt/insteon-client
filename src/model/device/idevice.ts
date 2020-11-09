import type Client from "../../client";
import InsteonId from "../api/insteon-id";

export interface IDevice {
  id: InsteonId;
  client: Client;

  beep(): Promise<void>;
}
