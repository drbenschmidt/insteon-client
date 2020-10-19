import { Client } from '../src'

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

(async () => {
  const client = await Client.createFor2245({
    user: process.env.INSTEON_USERNAME,
    pass: process.env.INSTEON_PASSWORD,
    host: "192.168.2.24",
    port: 25105,
  });

  client.on('tick', () => console.log('client tick event'));
  client.on('buffer', (buf) => console.log('buffer added', buf));

  client.open();

  await sleep(500);

  const light = client.getDevice('56.21.93');

  await light.info();

  await sleep(10000);
})().catch(console.error);
