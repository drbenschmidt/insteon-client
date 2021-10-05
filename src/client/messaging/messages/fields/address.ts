import InsteonId from "../../../../model/api/insteon-id";
import { MessageField } from "../types";

const address = (name: string): MessageField => {
  const reducer = (value: number[]): [Record<string, any>, number[]] => {
    const [a, b, c, ...rest] = value;
    const id = InsteonId.fromBytes(a, b, c);

    return [{ [name]: id }, rest];
  };

  reducer.byteLength = 3;

  return reducer;
};

export default address;
