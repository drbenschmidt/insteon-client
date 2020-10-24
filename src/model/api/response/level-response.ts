import { InsteonResponse } from "./insteon-response";

export default class LevelResponse {
  level: number;

  constructor(response: InsteonResponse) {
    this.level = Math.ceil(parseInt(response.standard.command2, 16) * 100 / 255);
  }
}
