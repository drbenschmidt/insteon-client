// TODO: Document where I got this from, they deserve credit!

export default class Mutex {
  private mutex = Promise.resolve();

  private lock(): PromiseLike<() => void> {
    let begin: (unlock: () => void) => void = (unlock) => {};

    this.mutex = this.mutex.then(() => {
      return new Promise(begin);
    });

    return new Promise((res) => {
      begin = res;
    });
  }

  async dispatch<T>(function_: (() => T) | (() => PromiseLike<T>)): Promise<T> {
    const unlock = await this.lock();
    try {
      return await Promise.resolve(function_());
    } finally {
      unlock();
    }
  }
}
