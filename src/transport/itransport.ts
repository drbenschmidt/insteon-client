export interface ITransport {
  open(): Promise<void>;
  close(): void;
  send(message: { raw: string }): Promise<{ data: string }>;
}
