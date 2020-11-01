import { Client } from "../src";
import parseMessageReceived from "../src/client/messaging/utils";
import type Light from "../src/model/device/light";
import { LogLevel } from "../src/utils/logger";
import sleep from "../src/utils/sleep";

const parseTest = () => {
  const extended = "025156219352C4EC112E000101000020201FFE1F0000000000";
  const standard = "025056219352C4EC202F0C";

  const result = parseMessageReceived(standard);

  console.log(result);
};

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

(async () => {
  const client = await Client.createFor2245({
    user: process.env.INSTEON_USERNAME,
    pass: process.env.INSTEON_PASSWORD,
    host: "192.168.2.24",
    port: 25105,
    logLevel: LogLevel.Debug,
  });

  const light = client.getDevice("56.21.93");

  // 025056219352C4EC202EFC
  // 025056219352C4EC201100
  light.turnOn("test");

  // await getLevel(light);

  // await dim(light);
  // await getInfo(light);

  // parseTest();

  // await sleep(2000);
})().catch(console.error);
