import { InsteonMessage } from "../insteon-message";
import { InsteonResponse } from "./insteon-response";

const { ceil } = Math;
const { parseInt } = Number;

export default class LevelResponse {
  level: number;

  constructor(response: InsteonResponse) {
    const { command2 } = response.standard as InsteonMessage;

    this.level = ceil((parseInt(command2, 16) * 100) / 255);
  }
}
