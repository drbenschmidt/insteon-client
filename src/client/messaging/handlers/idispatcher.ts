import type MessageHandler from '../handler';
import { MessageType } from '../constants';

export interface IDispatcher {
  id: string;
  name: string;

  checkSize(handler: MessageHandler, raw: string): string | Boolean;
  handle(handler: MessageHandler, raw: string, status: any): MessageType;
}
