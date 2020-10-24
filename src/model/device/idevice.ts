import Client from "../../client";
import InsteonId from "../api/insteon-id";

export interface IDevice {
  id: InsteonId;
  client: Client;

  getInfo(): Promise<void>;
  beep(): Promise<void>;
}
