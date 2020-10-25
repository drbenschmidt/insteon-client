import { InsteonResponse } from "./insteon-response";
const { ceil } = Math;

export default class LevelResponse {
  level: number;

  constructor(response: InsteonResponse) {
    const { standard: { command2 } } = response;

    this.level = ceil(parseInt(command2, 16) * 100 / 255);
  }
}
