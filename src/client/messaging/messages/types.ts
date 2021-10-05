export type MessageField = {
  (value: number[]): [Record<string, any>, number[]];
  byteLength: number;
};

export interface AbstractMessage {
  id: number;
}
