/** @jsx createElementEntity */
import { AgentParams } from "../inflators/agent";
import { createElementEntity, createRef, renderAsEntity } from "../utils/jsx-entity";
import { preload } from "../utils/preload";
import { cloneModelFromCache, loadModel } from "../components/gltf-model-plus";
import agentModelSrc from "../assets/models/cute_agent.glb";
import { AElement } from "aframe";
import { Vector3 } from "three";
import { HubsWorld } from "../app";
import { MediaLoaderParams } from "../inflators/media-loader";


preload(loadModel(agentModelSrc, null, true));

const agentMediaParams:MediaLoaderParams = {
  src: agentModelSrc, 
  recenter: true, 
  resize: true, 
  animateLoad: true, 
  isObjectMenuTarget: true
}

export function agentPrefab(params: AgentParams = { language: 0, needed: false }) { 
  return <entity 
    name="Agent" 
    agent={{ language: params.language, needed: params.needed }} 
    scale={[1, 1, 1]}
    mediaLoader={agentMediaParams}
  />;
}

export function addAgentToScene(
  world: HubsWorld
){
  const eid = renderAsEntity(world, agentPrefab());
  const obj = world.eid2obj.get(eid)!;
  AFRAME.scenes[0].object3D.add(obj);
  return eid;
}

export function setAgentParams(eid:any){
  const avatarPov = (document.querySelector("#avatar-pov-node")! as AElement).object3D;
  const obj = APP.world.eid2obj.get(eid)!;
  obj.position.copy(avatarPov.localToWorld(new Vector3(0, 0, -1.5)));
  obj.lookAt(avatarPov.getWorldPosition(new Vector3()));

  return "SetAgentParams did run"
}
