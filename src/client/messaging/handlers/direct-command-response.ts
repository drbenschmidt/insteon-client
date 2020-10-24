import type MessageHandler from '../handler';
import { IDispatcher } from './idispatcher';
import { DispatcherBase } from './dispatcher-base';
import { MessageType } from '../constants';

export default class Dispatcher extends DispatcherBase {
  id: string = '0262';
  name: string = 'Direct Command Response';

  register(map: Map<String, IDispatcher>): void {
    map.set(this.id, this);
  }
  
  checkSize(handler: MessageHandler, raw: string): string | Boolean {
    // Under 12 characters, we don't have the flags byte, so we need more.
    if (raw.length < 12) {
      return false;
    }

    // The interesting thing about an 0262 is it's a variable length response.
    // So unlike the other responses, we need to get to the message flags byte to know
    // whether it's a standard (18 hex chars) or extended (46 hex chars) response.
    var flags = parseInt(raw.substr(10, 2), 16);
    var isExtended = (flags & 0x10) !== 0;
    var expectedLength = isExtended ? 46 : 18;

    if (raw.length < expectedLength) {
      return false;
    }

    console.log(`expected length ${expectedLength}, raw length ${raw.length}, updating buffer`);
    handler.buffer = raw.substr(expectedLength);
    console.log(`new message buffer: "${handler.buffer}"`);

    return raw.substr(0, expectedLength);
  }

  handle(handler: MessageHandler, raw: string, status: any): MessageType {
    if (!handler.currentRequest) {
      return MessageType.SKIPPED;
    }

    /*this.emit('recvCommand', {
      type: '62',
      raw: raw.substr(0, status.command.raw.length + 2)
    });*/

    status.ack = raw.substr(status.command.raw.length, 2) === '06';
    status.nack = raw.substr(status.command.raw.length, 2) === '15';

    return MessageType.PROCESSED;
  }
}
