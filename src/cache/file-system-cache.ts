import fs from "fs-extra";
import path from "path";
import Cache from "./cache";

class FileSystemCache implements Cache {
  private filePath: string;
  private state: Record<string, any>;
  private isInitialized = false;

  constructor(fileName: string) {
    const { env, platform } = process;
    const userHomeDir = env[platform === "win32" ? "USERPROFILE" : "HOME"];
    this.filePath = path.join(userHomeDir, fileName);
  }

  async init(): Promise<void> {
    try {
      const result = fs.readJsonSync(this.filePath, {
        throws: false,
      }) as Record<string, any>;
      this.state = result ?? {};
    } finally {
      this.isInitialized = true;
    }
  }

  async get<T>(key: string): Promise<T> {
    if (!this.isInitialized) {
      await this.init();
    }

    return this.state[key] as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    this.state[key] = value;

    await fs.outputJson(this.filePath, this.state);
  }
}

export default FileSystemCache;
