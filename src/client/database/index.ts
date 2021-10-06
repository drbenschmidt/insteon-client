import InsteonId from "../../model/api/insteon-id";
import FileSystemCache from "../../cache/file-system-cache";
import TypeLookup, { DeviceLookupRecord } from "./lookup";
import type {
  AllLinkRecordResponseMessage,
  NextAllLinkRecordMessage,
} from "../messaging/messages/index";
import type Client from "..";
import type Context from "../context";

const applyType = (
  link: AllLinkRecordResponseMessage
): AllLinkRecordResponseMessageWithType => {
  const type = TypeLookup.find(
    (t) => t.category === link.data1 && t.subcategory === link.data2
  );

  if (type) {
    return {
      ...link,
      ...type,
    };
  }

  return link;
};

export enum AckNak {
  ACK = 0x06,
  NAK = 0x15,
}

export type AllLinkRecordResponseMessageWithType = AllLinkRecordResponseMessage &
  Partial<DeviceLookupRecord>;

class DeviceDatabase {
  private client: Client;
  private context: Context;
  private cache: FileSystemCache;
  devices: AllLinkRecordResponseMessage[] = [];

  constructor(client: Client, context: Context) {
    this.client = client;
    this.context = context;
    this.cache = new FileSystemCache("device-database.json");
  }

  async init(forceRefresh = false): Promise<void> {
    this.context.logger.info("Initializing Device Database");
    await this.cache.init();
    await this.fetchFromCache();

    if (forceRefresh || this.devices.length === 0) {
      this.devices = [];
      await this.fetchFromModem();
    }
  }

  async fetchFromCache(): Promise<void> {
    const value = await this.cache.get<AllLinkRecordResponseMessage[]>(
      "devices"
    );
    if (Array.isArray(value)) {
      this.devices.push(...value);
    }
  }

  async fetchFromModem(): Promise<void> {
    let fetching = true;
    const onDeviceMessage = (result) => {
      this.devices.push(result);
      this.context.logger.info(`Found ${this.devices.length} devices...`);
    };
    this.context.emitter.on("message_type_57", onDeviceMessage);

    // Send the first one.
    await this.client.sendRaw("0269", "69");

    while (fetching) {
      const result = await this.client.sendRaw<NextAllLinkRecordMessage>(
        "026A",
        "6A"
      );

      if (result.ack === AckNak.NAK) {
        fetching = false;
        this.context.emitter.off("message_type_57", onDeviceMessage);
        this.cache.set("devices", this.devices);
      }
    }
  }

  getDeviceRecords(id: InsteonId): AllLinkRecordResponseMessage[] {
    return this.devices.filter((d) => id.equals(d));
  }

  getDevices(): AllLinkRecordResponseMessageWithType[] {
    return this.devices.filter((d) => d.group === 0).map(applyType);
  }

  getLinksForId(id: InsteonId): AllLinkRecordResponseMessage[] {
    return this.devices.filter((d) => d.group !== 0 && id.equals(d.target));
  }
}

export default DeviceDatabase;
