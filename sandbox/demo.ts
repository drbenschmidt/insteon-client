import { Client } from "../src";
import InsteonId from "../src/model/api/insteon-id";
import type Light from "../src/model/device/light";
import { LogLevel } from "../src/utils/logger";
import sleep from "../src/utils/sleep";

const getLevel = async (light: Light) => {
  const { level } = await light.getLevel();
  console.log("Level", level);
  return level;
};

const setLevel = async (light: Light) => {
  const level = await getLevel(light);
  light.setLevel(level === 65 ? 0 : 65);
};

const getInfo = async (light: Light) => {
  const info = await light.getInfo();

  console.log("INFO", info);
};

const dim = async (light: Light) => {
  await light.dim();
  await getLevel(light);
};

const ID = {
  KITCHEN_LIGHTS: new InsteonId("56.38.07"),
  DINETTE_LIGHTS: new InsteonId("56.21.93"),
  ISLAND_LIGHTS: new InsteonId("56.38.5C"),
};

(async () => {
  const client = await Client.createFor2245({
    user: process.env.INSTEON_USERNAME,
    pass: process.env.INSTEON_PASSWORD,
    host: "192.168.1.48",
    port: 25105,
    logLevel: LogLevel.Info,
  });

  await client.open();

  // Just keep running, let the console logging show packets.
  // await sleep(60 * 60 * 1000);

  // const light = client.getDevice("56.21.93");

  // Island Lights
  // const light = client.getDevice("56.38.5C");

  await client.db.init(true);
  console.log(`Fetched ${client.db.devices.length} devices!`);

  // const records = client.db.getDeviceRecords(new InsteonId("56.38.5C"));

  // console.log(records);

  const devices = client.db.getLinksForId(ID.DINETTE_LIGHTS);
  console.log(devices);

  // await light.beep();

  // 025056219352C4EC202EFC
  // 025056219352C4EC201100
  // await light.turnOffFast();

  // await getLevel(light);

  // await dim(light);
  // await getInfo(light);

  // parseTest();

  await sleep(2000 * 1000);
})().catch(console.error);
