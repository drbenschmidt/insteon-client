import { Client } from "../src";
import { LogLevel } from "../src/utils/logger";
import sleep from "../src/utils/sleep";

(async () => {
  const client = await Client.createFor2245({
    user: process.env.INSTEON_USERNAME,
    pass: process.env.INSTEON_PASSWORD,
    host: "192.168.2.24",
    port: 25105,
    logLevel: LogLevel.Info,
  });

  const light = client.getDevice("56.21.93");

  const { level } = await light.getLevel();
  light.setLevel(level === 65 ? 0 : 65);

  await sleep(2000);
})().catch(console.error);
