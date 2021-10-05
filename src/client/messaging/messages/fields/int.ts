import { MessageField } from "../types";

const int = (name: string): MessageField => {
  const reducer = (value: number[]): [Record<string, number>, number[]] => {
    const [v, ...rest] = value;

    return [{ [name]: v }, rest];
  };

  reducer.byteLength = 1;

  return reducer;
};

export default int;
