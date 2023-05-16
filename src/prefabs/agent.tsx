/** @jsx createElementEntity */
import { AgentParams } from "../inflators/agent";
import { createElementEntity, createRef } from "../utils/jsx-entity";

export function agentPrefab(params: AgentParams = { language: 0, needed: false }) {
  return <entity agent={{ language: params.language, needed: params.needed }} />;
}