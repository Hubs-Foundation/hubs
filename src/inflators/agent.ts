import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Agent } from "../bit-components";

export type AgentParams = {
  language: number;
  needed: boolean;
  follow: boolean;
};

export const AGENT_FLAGS ={
  NEEDED: 1<<0,
  FOLLOW: 1<<1
};

export function inflateAgent(world: HubsWorld, eid: number, params: AgentParams) {
  addComponent(world, Agent, eid);
  let flags = 0;
  Agent.language[eid] = params.language;
  if (params.needed) flags |= AGENT_FLAGS.NEEDED;
  if (params.follow) flags |= AGENT_FLAGS.FOLLOW;
  Agent.flags[eid] = flags;
}