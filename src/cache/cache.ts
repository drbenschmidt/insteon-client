export default interface Cache {
  init(): Promise<void>;
  get<T>(key: string): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
}
