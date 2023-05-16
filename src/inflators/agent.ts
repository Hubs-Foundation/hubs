import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Agent } from "../bit-components";

export type AgentParams = {
  language: number;
  needed: boolean;
};

export const AGENT_FLAGS ={
  NEEDED: 1<<0
};

export function inflateAgent(world: HubsWorld, eid: number, params: AgentParams) {
  addComponent(world, Agent, eid);
  Agent.language[eid] = params.language;
  if (params.needed) Agent.needed[eid] |= AGENT_FLAGS.NEEDED;
}