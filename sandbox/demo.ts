import { Client } from '../src'

(async () => {
  const client = await Client.createFor2245({
    user: process.env.INSTEON_USERNAME,
    pass: process.env.INSTEON_PASSWORD,
    host: "192.168.2.24",
    port: 25105,
  });

  const light = client.getDevice('56.21.93');

  await light.beep();
})().catch(console.error);
