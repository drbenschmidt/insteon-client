import { IDispatcher } from "./idispatcher";
import DirectCommandResponse from "./direct-command-response";
import StandardCommandResponse from "./standard-command";

const Handlers = new Map<string, IDispatcher>();

new DirectCommandResponse().register(Handlers);
new StandardCommandResponse().register(Handlers);

export default Handlers;
