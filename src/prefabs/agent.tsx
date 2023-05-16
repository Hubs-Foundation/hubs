/** @jsx createElementEntity */
import { AgentParams } from "../inflators/agent";
import { createElementEntity, createRef } from "../utils/jsx-entity";
import { getAvatarSrc } from "../utils/avatar-utils";
import { preload } from "../utils/preload";
import { cloneModelFromCache, loadModel } from "../components/gltf-model-plus";
import agentModelSrc from "../assets/models/cute_agent.glb";
import { AElement } from "aframe";
import { Vector3 } from "three";


preload(loadModel(agentModelSrc, null, true));
console.log("Agent Model Src:", agentModelSrc);




export function agentPrefab(params: AgentParams = { language: 0, needed: false }) {

  console.log("i am returning");
  return <entity 
    name="Agent" 
    agent={{ language: params.language, needed: params.needed }} 
    model={ { model: cloneModelFromCache(agentModelSrc).scene }}
    scale={[2, 2, 2]}
    position={[0,0,0]}

  />;
}

export function setAgentParams(eid:any){

  const avatarPov = (document.querySelector("#avatar-pov-node")! as AElement).object3D;
  const obj = APP.world.eid2obj.get(eid)!;
  obj.position.copy(avatarPov.localToWorld(new Vector3(0, 0, -1.5)));
  obj.lookAt(avatarPov.getWorldPosition(new Vector3()));


}
