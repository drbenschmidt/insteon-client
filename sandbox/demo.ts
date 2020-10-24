import { Client } from '../src'

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

(async () => {
  const client = await Client.createFor2245({
    user: process.env.INSTEON_USERNAME,
    pass: process.env.INSTEON_PASSWORD,
    host: "192.168.2.24",
    port: 25105,
  });

  const light = client.getDevice('56.21.93');

  light.getLevel().then(value => console.log(`Dinette Light Level: ${value.level}`));
  light.setLevel(65);

  await sleep(5000);
})().catch(console.error);
