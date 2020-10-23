import { DeviceCommandRequest } from '../model/device';
import Logger from '../utils/logger';

function parseMessageReceived(raw: string) {
  var cmd: any = {};
  cmd.type = raw.substr(2, 2);
  if (cmd.type !== '51' && cmd.type !== '50') {
    return null;
  }
  cmd.id = raw.substr(4, 6);
  cmd.gatewayId = raw.substr(10, 6);
  var typeFlag = parseInt(raw.substr(16, 1), 16);
  cmd.extended = cmd.type === '51'; // typeFlag & 1 !== 0; // bit mask 0001
  cmd.messageType = typeFlag >> 1;
  var hopFlag = parseInt(raw.substr(17, 1), 16);
  cmd.hopsLeft = hopFlag >> 2;
  cmd.maxHops = hopFlag & 3; // bit mask 0011
  cmd.command1 = raw.substr(18, 2);
  cmd.command2 = raw.substr(20, 2);

  if (cmd.extended) {
    cmd.userData = [];
    for (var i = 0; i < 14; i++) {
      cmd.userData.push(raw.substr(22 + (i * 2), 2));
    }
    cmd.raw = raw.substr(0, (25 * 2));
  } else {
    cmd.raw = raw.substr(0, (11 * 2));
  }
  return cmd;
}

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

    console.log(`expected length ${expectedLength}, raw length ${raw.length}, updating buffer`);
    this.buffer = raw.substr(expectedLength);
    console.log(`new message buffer: "${this.buffer}"`);

    return raw.substr(0, expectedLength);
  },
  handler: function (raw: string, status: any) {
    if (!this.currentRequest) {
      return MESSAGES.SKIPPED;
    }

    /*this.emit('recvCommand', {
      type: '62',
      raw: raw.substr(0, status.command.raw.length + 2)
    });*/

    status.ack = raw.substr(status.command.raw.length, 2) === '06';
    status.nack = raw.substr(status.command.raw.length, 2) === '15';

    return MESSAGES.PROCESSED;
  }
};

const dispatcher2 = {
  id: '0250',
  name: 'Standard Command',
  size: 22,
  checkSize: function (raw: string) {
    if (raw.length < 22) {
      return false;
    }
    this.buffer = raw.substr(22);
    return raw.substr(0, 22);
  },
  handler: function (raw: string , status: any) {
    var cmd = {
      standard: parseMessageReceived(raw)
    };
    // console.log('recieved command', cmd);
    // this.emit('recvCommand', cmd);
    // debug('Parsed command: %j', cmd);
    // debug('Status: %j', status);
    var id = cmd.standard.id.toUpperCase();
    // debug('Devices: %j', Object.keys(this.devices));

    // TODO: Allow device objects to be notified to update based on the response.
    /*if (this.devices[id]) {
      console.log(`Handle Command for device: ${id}`);
      //this.handleCommand(this.devices[id], cmd);
    }*/

    const requestId = status?._command?.destinationId?.toString();

    if (requestId !== id) { // command isn't a response for a command we sent
      console.log(`message not from command we sent req: ${requestId} resp: ${id}`);
      //this.emit('command', cmd);
      return MESSAGES.SKIPPED;
    }

    if (!status.response) {
      status.response = {};
    }

    var responseCount = status.command.responseCount;

    if (responseCount) {
      status.response.standard = status.response.standard || [];
      status.response.standard.push(cmd.standard);
      status.success = status.response.standard.length === responseCount;
    } else {
      status.response.standard = cmd.standard;
      status.success = cmd.standard !== undefined && cmd.standard !== null &&
        (!status.command.extended || !!status.command.isStandardResponse) &&
        !status.command.waitForExtended && !status.command.waitForLinking;
    }

    return MESSAGES.PROCESSED;
  }
}

export default class MessageHandler {
  private static log = new Logger('Message Handler');
  private currentRequest: DeviceCommandRequest;
  private buffer: string = '';
  private timeout: number = 1000;
  private dispatchers: Map<String, any> = new Map();

  constructor() {
    this.dispatchers.set(dispatcher.id, dispatcher);
    this.dispatchers.set(dispatcher2.id, dispatcher2);
  }

  setRequest(req: DeviceCommandRequest) {
    this.currentRequest = req;
    this.buffer = '';
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
    this.buffer += bufferIn
    var result; // Just trying to be careful and suss out every single path
    var raw = this.buffer;
    MessageHandler.log.debug(`decode - buffer: ${raw}`);
    var status = this.currentRequest;
    MessageHandler.log.debug(`decode - status: ${status}`);

    // check for gateway NAK
    if (raw.substr(0, 2) === '15' && this.currentRequest && this.timeout) {
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
      MessageHandler.log.debug('another command found at ' + nextCmdAt);
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
