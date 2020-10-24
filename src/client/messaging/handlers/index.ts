import { IDispatcher } from './idispatcher';
import DirectCommandResponse from './direct-command-response';
import StandardCommandResponse from './standard-command';

export const Handlers = new Map<String, IDispatcher>();

(new DirectCommandResponse()).register(Handlers);
(new StandardCommandResponse()).register(Handlers);
