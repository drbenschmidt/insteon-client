import { LogLevel } from "../utils/logger";

export type ClientConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;

  logLevel?: LogLevel;
};
