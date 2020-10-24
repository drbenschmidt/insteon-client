import { DeviceCommandRequest } from '../../model/device';
import Logger from '../../utils/logger';
import { MessageType } from './constants';
import { Handlers } from './handlers';

export default class MessageHandler {
  private static log = new Logger('Message Handler');
  private timeout: number = 1000;
  private dispatchers = Handlers;
  public currentRequest: DeviceCommandRequest;
  public buffer: string = '';

  setRequest(req: DeviceCommandRequest) {
    this.currentRequest = req;
    this.buffer = '';
  }

  process = (bufferIn?: string) => {
    var result = this.decode(bufferIn);

    switch (result) {
      case MessageType.INSUFFICIENT_DATA:
        MessageHandler.log.debug(`parsing - insufficient data to continue - ${this.buffer.length}`);
        break;
      case MessageType.PROCESSED:
      case MessageType.SKIPPED:
        // If a message was consumed or skipped
        MessageHandler.log.debug(`parsing - message ${(result === MessageType.PROCESSED ? 'consumed' : 'skipped')}`);
        if (this.buffer?.length > 0) {
          // Run this again, but allow the message loop a chance to wake up.
          setTimeout(() => {
            MessageHandler.log.debug('parsing - buffer still full, looping');
            this.process();
          }, 0);
        }
        break;
      default:
        MessageHandler.log.debug(`parsing - unknown result ${result}`);
    }
  }
  
  decode = (bufferIn?: string) => {
    if (bufferIn?.length > 0) {
      this.buffer += bufferIn
    }

    var result; // Just trying to be careful and suss out every single path
    var raw = this.buffer;
    MessageHandler.log.debug(`decode - buffer: ${raw}`);
    var status = this.currentRequest;
    MessageHandler.log.debug(`decode - status: ${status}`);

    // check for gateway NAK
    if (raw.substr(0, 2) === '15' && this.currentRequest /*&& this.timeout*/) {
      // NAK = negative acknowledgement.
      // Got a PLM NAK; retry our command, if applicable
      /*var gw = this;
      var nakTimeout = this.status.nakTimeout;
      this.status.nakTimeout *= 2; // Exponential backoff

      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {
        sendCommandTimout(gw, gw.status.timeout, gw.commandRetries);
      }, nakTimeout);
      */
      this.buffer = raw.substr(2);
      
      // TODO: Handle gateway NAK.

      return MessageType.PROCESSED;
    }

    // check for enough data
    if (raw.length <= 4) {
      return MessageType.INSUFFICIENT_DATA; // buffering
    }

    var nextCmdAt = raw.search(/02(5[0-8]|6[0-9a-f]|7[0-3])/i);
    if (nextCmdAt > 0) {
      MessageHandler.log.debug('another command found at ' + nextCmdAt);
      this.buffer = raw = raw.substr(nextCmdAt);
    }

    var type = raw.substr(0, 4);

    // Dispatcher-style handling
    var dispatcher = this.dispatchers.get(type.toUpperCase());
    if (dispatcher) {
      var rawMsg = dispatcher.checkSize(this, raw);
      if (rawMsg === false) {
        return MessageType.INSUFFICIENT_DATA;
      }
      MessageHandler.log.debug(`decode - dispatcher - ${dispatcher.name}`);
      result = dispatcher.handle(this, rawMsg as string, status);
      if (result !== MessageType.SKIPPED) {
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
      return MessageType.SKIPPED;
    }
  }

  trailer = () => {
    const { currentRequest: status } = this;
    // MessageHandler.log.debug(`status (after parsing): ${JSON.stringify(status)}`);
    MessageHandler.log.debug(`trailer - exitOnAck: ${status.command.exitOnAck}, success: ${status.success}, ack: ${status.ack}, nack: ${status.nack}`);
    if (status) {
      if (status.command.exitOnAck) {
        status.success = status.ack;
      }
      if (status.nack || (status.success && status.ack)) {
        if (this.timeout) {
          clearTimeout(this.timeout);
          delete this.timeout;
        }
        delete this.currentRequest;
        status.callback(status);
        // sendCommand(this, this.queue.shift());
      }
    }
  }
}
