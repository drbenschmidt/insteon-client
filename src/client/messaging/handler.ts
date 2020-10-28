import { InsteonRequestWrapper } from "../../model/api/insteon-message";
import Logger, { LogLevel } from "../../utils/logger";
import { MessageType } from "./constants";
import Handlers from "./handlers";

export type MessageHandlerProperties = {
  logLevel?: LogLevel;
};

export default class MessageHandler {
  private log: Logger;

  private timeout = 1000;

  private dispatchers = Handlers;

  public currentRequest: InsteonRequestWrapper;

  public buffer = "";

  constructor(properties: MessageHandlerProperties) {
    const { logLevel } = properties;

    this.log = new Logger("Message Handler", undefined, logLevel);
  }

  setRequest(request: InsteonRequestWrapper): void {
    this.currentRequest = request;
    this.buffer = "";
  }

  process = (bufferIn?: string): void => {
    const result = this.decode(bufferIn);

    switch (result) {
      case MessageType.INSUFFICIENT_DATA:
        this.log.debug(
          `parsing - insufficient data to continue - ${this.buffer.length}`
        );
        break;
      case MessageType.PROCESSED:
      case MessageType.SKIPPED:
        // If a message was consumed or skipped
        this.log.debug(
          `parsing - message ${
            result === MessageType.PROCESSED ? "consumed" : "skipped"
          }`
        );
        if (this.buffer?.length > 0) {
          // Run this again, but allow the message loop a chance to wake up.
          setTimeout(() => {
            this.log.debug("parsing - buffer still full, looping");
            this.process();
          }, 0);
        }
        break;
      default:
        this.log.debug(`parsing - unknown result ${result}`);
    }
  };

  decode = (bufferIn?: string): MessageType => {
    if (bufferIn?.length > 0) {
      this.buffer += bufferIn;
    }

    let result; // Just trying to be careful and suss out every single path
    let raw = this.buffer;
    this.log.debug(`decode - buffer: ${raw}`);
    const status = this.currentRequest;
    this.log.debug(`decode - status: ${status}`);

    // check for gateway NAK
    if (raw.slice(0, 2) === "15" && this.currentRequest /* && this.timeout */) {
      // NAK = negative acknowledgement.
      // Got a PLM NAK; retry our command, if applicable
      /* var gw = this;
      var nakTimeout = this.status.nakTimeout;
      this.status.nakTimeout *= 2; // Exponential backoff

      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {
        sendCommandTimout(gw, gw.status.timeout, gw.commandRetries);
      }, nakTimeout);
      */
      this.buffer = raw.slice(2);

      // TODO: Handle gateway NAK.

      return MessageType.PROCESSED;
    }

    // check for enough data
    if (raw.length <= 4) {
      return MessageType.INSUFFICIENT_DATA; // buffering
    }

    const nextCmdAt = raw.search(/02(5[0-8]|6[\da-f]|7[0-3])/i);
    if (nextCmdAt > 0) {
      this.log.debug(`another command found at ${nextCmdAt}`);
      raw = raw.slice(nextCmdAt);
      this.buffer = raw;
    }

    const type = raw.slice(0, 4);

    // Dispatcher-style handling
    const dispatcher = this.dispatchers.get(type.toUpperCase());
    if (dispatcher) {
      const rawMessage = dispatcher.checkSize(this, raw);
      if (rawMessage === false) {
        return MessageType.INSUFFICIENT_DATA;
      }
      this.log.debug(`decode - dispatcher - ${dispatcher.name}`);
      result = dispatcher.handle(this, rawMessage as string, status);
      if (result !== MessageType.SKIPPED) {
        this.trailer();
      }
      return result;
    }
    this.log.debug(
      `decode - dispatcher - No dispatcher for ${type.toUpperCase()}`
    );
    if (this.buffer.length > 4) {
      this.buffer = this.buffer.slice(4);
    } else {
      this.buffer = "";
    }
    return MessageType.SKIPPED;
  };

  trailer = (): void => {
    const { currentRequest } = this;
    this.log.debug(
      `trailer - exitOnAck: ${currentRequest.request.exitOnAck}, success: ${currentRequest.success}, ack: ${currentRequest.ack}, nack: ${currentRequest.nack}`
    );

    if (currentRequest) {
      if (currentRequest.request.exitOnAck) {
        currentRequest.success = currentRequest.ack;
      }

      if (
        currentRequest.nack ||
        (currentRequest.success && currentRequest.ack)
      ) {
        if (this.timeout) {
          clearTimeout(this.timeout);
          delete this.timeout;
        }
        delete this.currentRequest;
        currentRequest.callback(currentRequest.response);
      }
    }
  };
}
