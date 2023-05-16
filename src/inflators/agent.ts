import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Agent } from "../bit-components";

export type AgentParams = {
  language: number;
  needed: boolean;
};
export function inflateAgent(world: HubsWorld, eid: number, params: AgentParams) {
  addComponent(world, Agent, eid);
  Agent.language[eid] = params.language;
  Agent.needed = params.needed;
}