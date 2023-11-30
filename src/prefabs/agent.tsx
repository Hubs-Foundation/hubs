/** @jsx createElementEntity */
import agentModelSrc from "../assets/models/voxy_emitted.glb";
import { createElementEntity, renderAsEntity, createRef } from "../utils/jsx-entity";
import { preload } from "../utils/preload";
import { cloneModelFromCache, loadModel } from "../components/gltf-model-plus";
import { HubsWorld } from "../app";
import nametagSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { AgentPanel, SimplePanel } from "./agent-panel";
import { addComponent } from "bitecs";
import { Hidden } from "../bit-components";
import { COLLISION_LAYERS } from "../constants";
import { Object3D, Vector3 } from "three";
import { HUDLangPanel } from "./hud-lang-panel";
import { virtualAgent } from "../bit-systems/agent-system";

preload(loadModel(agentModelSrc, null, true));

export function AgentEntity() {
  const agentRef = createRef();
  const panelRef = createRef();
  const micRef = createRef();
  const snapRef = createRef();
  const nextRef = createRef();
  const prevRef = createRef();
  const textRef = createRef();

  return (
    <entity
      name="Agent"
      agent={{ panelRef, textRef, micRef, snapRef, nextRef, prevRef }}
      ref={agentRef}
      model={{ model: cloneModelFromCache(agentModelSrc).scene }}
      cursorRaycastable
      remoteHoverTarget
      handCollisionTarget
      offersRemoteConstraint
      offersHandConstraint
      makeKinematicOnRelease
      holdable
      floatyObject
      rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
      physicsShape={{ halfExtents: [0.22, 0.14, 0.1] }}
      lookatuser
    >
      <SimplePanel panelRef={panelRef} textRef={textRef} micRef={micRef} />
    </entity>
  );
}

export function addAgentToScene(world: HubsWorld, userPOV: Object3D) {
  const eid = renderAsEntity(world, AgentEntity());
  const obj = world.eid2obj.get(eid)!;
  userPOV.add(obj);
  let a = virtualAgent.avatarDirection;
  obj.position.copy(obj.position.clone().add(a.multiplyScalar(2)));
  return eid;
}

export function addLangPanelToScene(world: HubsWorld) {
  const eid = renderAsEntity(world, HUDLangPanel());
  const obj = world.eid2obj.get(eid)!;
  world.scene.add(obj);
  return eid;
}
