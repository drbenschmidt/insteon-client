import { MessageField } from "../types";

export class UserData {
  private data: Map<string, number> = new Map<string, number>();

  constructor(bytes: number[]) {
    bytes.forEach((val, index) => {
      this.data.set(`d${index + 1}`, val);
    });
  }

  toString(): string {
    return Array.from(this.data.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join(",");
  }

  setChecksum(cmd1: number, cmd2: number): void {}

  setCrc(cmd1: number, cmd2: number): void {}
}

const userData = (name: string): MessageField => {
  const reducer = (value: number[]): [Record<string, any>, number[]] => {
    const data = value.slice(0, 14);
    const rest = value.slice(14);
    const temp = new UserData(data);

    return [{ [name]: temp }, rest];
  };

  reducer.byteLength = 14;

  return reducer;
};

export default userData;
