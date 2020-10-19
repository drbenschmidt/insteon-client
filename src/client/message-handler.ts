import { DeviceCommandRequest } from '../model/device';
import Logger from '../utils/logger';

export const MESSAGES = Object.freeze({
  PROCESSED: Symbol('PROCESSED'),
  INSUFFICIENT_DATA: Symbol('INSUFFICIENT_DATA'),
  SKIPPED: Symbol('MESSAGE_SKIPPED'),
});

const dispatcher = {
  id: '0262',
  name: 'Direct Command Response',
  checkSize: function (raw: string) {
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

    this.buffer = raw.substr(expectedLength);

    return raw.substr(0, expectedLength);
  },
  handler: function (raw: string, status: any) {
    if (!this.status) {
      return MESSAGES.SKIPPED;
    }

    /*this.emit('recvCommand', {
      type: '62',
      raw: raw.substr(0, status.command.raw.length + 2)
    });*/

    console.log('asfd', status);

    status.ack = raw.substr(status.command.raw.length, 2) === '06';
    status.nack = raw.substr(status.command.raw.length, 2) === '15';

    return MESSAGES.PROCESSED;
  }
};

export default class MessageHandler {
  private static log = new Logger('Message Handler');
  private status: DeviceCommandRequest;
  private buffer: string = '';
  private timeout: number = 1000;
  private dispatchers: Map<String, any> = new Map();

  constructor() {
    this.dispatchers.set(dispatcher.id, dispatcher);
  }

  setRequest(req: DeviceCommandRequest) {
    this.status = req;
  }

  process = (bufferIn?: string) => {
    var result = this.decode(bufferIn);

    switch (result) {
      case MESSAGES.INSUFFICIENT_DATA:
        MessageHandler.log.debug(`parsing - insufficient data to continue - ${this.buffer.length}`);
        break;
      case MESSAGES.PROCESSED:
      case MESSAGES.SKIPPED:
        // If a message was consumed or skipped
        MessageHandler.log.debug(`parsing - message ${(result === MESSAGES.PROCESSED ? 'consumed' : 'skipped')}`);
        if (this.buffer) {
          // Run this again, but allow the message loop a chance to wake up.
          /*setTimeout(() => {
            this.process();
          }, 0);*/
        }
        break;
      default:
        MessageHandler.log.debug(`parsing - unknown result ${result}`);
    }
  }
  
  decode = (bufferIn?: string) => {
    this.buffer += bufferIn
    var result; // Just trying to be careful and suss out every single path
    var raw = this.buffer;
    MessageHandler.log.debug(`decode - buffer: ${raw}`);
    var status = this.status;
    MessageHandler.log.debug(`decode - status: ${status}`);

    // check for gateway NAK
    if (raw.substr(0, 2) === '15' && this.status && this.timeout) {
      // Got a PLM NAK; retry our command, if applicable
      /*var gw = this;
      var nakTimeout = this.status.nakTimeout;
      this.status.nakTimeout *= 2; // Exponential backoff

      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {
        sendCommandTimout(gw, gw.status.timeout, gw.commandRetries);
      }, nakTimeout);

      this.buffer = raw.substr(2);
      */
      // TODO: Handle gateway NAK.

      return MESSAGES.PROCESSED;
    }

    // check for enough data
    if (raw.length <= 4) {
      return MESSAGES.INSUFFICIENT_DATA; // buffering
    }

    var nextCmdAt = raw.search(/02(5[0-8]|6[0-9a-f]|7[0-3])/i);
    if (nextCmdAt > 0) {
      this.buffer = raw = raw.substr(nextCmdAt);
    }

    var type = raw.substr(0, 4);

    // Dispatcher-style handling
    var dispatcher = this.dispatchers.get(type.toUpperCase());
    if (dispatcher) {
      var rawMsg = dispatcher.checkSize.call(this, raw);
      if (rawMsg === false) {
        return MESSAGES.INSUFFICIENT_DATA;
      }
      MessageHandler.log.debug(`decode - dispatcher - ${dispatcher.name}`);
      result = dispatcher.handler.call(this, rawMsg, status);
      if (result !== MESSAGES.SKIPPED) {
        this.trailer();
      }
      return result;
    } else {
      MessageHandler.log.debug(`decode - dispatcher - No dispatcher for ${type.toUpperCase()}`);
      if (this.buffer.length > 4) {
        this.buffer = this.buffer.substr(4);
      } else {
        this.buffer = '';
      }
      return MESSAGES.SKIPPED;
    }
  }

  trailer = () => {
    const { status } = this;
    MessageHandler.log.debug(`status (after parsing): ${JSON.stringify(status)}`);

    if (status) {
      if (status.command.exitOnAck) {
        status.success = status.ack;
      }
      if (status.nack || (status.success && status.ack)) {
        if (this.timeout) {
          clearTimeout(this.timeout);
          delete this.timeout;
        }
        delete this.status;
        status.callback(status);
        // sendCommand(this, this.queue.shift());
      }
    }
  }
}