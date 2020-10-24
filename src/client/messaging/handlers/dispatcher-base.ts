import { MessageType } from '../constants';
import type MessageHandler from '../handler';
import { IDispatcher } from './idispatcher';

export abstract class DispatcherBase implements IDispatcher {
  abstract id: string;
  abstract name: string;

  checkSize(handler: MessageHandler, raw: string): string | Boolean {
    if (raw.length < 22) {
      return false;
    }
    handler.buffer = raw.substr(22);
    return raw.substr(0, 22);
  }

  abstract handle(handler: MessageHandler, raw: string, status: any): MessageType;
  abstract register(map: Map<String, IDispatcher>): void;
}
