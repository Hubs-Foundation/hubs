/** @jsx createElementEntity */
import agentModelSrc from "../assets/models/cute_agent.glb";
import { createElementEntity, renderAsEntity, createRef } from "../utils/jsx-entity";
import { preload } from "../utils/preload";
import { cloneModelFromCache, loadModel } from "../components/gltf-model-plus";
import { HubsWorld } from "../app";
import nametagSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { AgentPanel } from "./agent-panel";
import { addComponent } from "bitecs";
import { Hidden } from "../bit-components";
import { COLLISION_LAYERS } from "../constants";

preload(loadModel(agentModelSrc, null, true));
const panelTexture = textureLoader.load(nametagSrc);

export function AgentEntity() {
  const agentRef = createRef();
  const panelRef = createRef();
  const micRef = createRef();
  const snapRef = createRef();
  const nextRef = createRef();
  const prevRef = createRef();
  const text = ["", ""];

  return (
    <entity
      name="Agent"
      agent={{ panelRef, micRef, snapRef, nextRef, prevRef }}
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
      <AgentPanel
        micRef={micRef}
        snapRef={snapRef}
        text={text}
        panelRef={panelRef}
        nextRef={nextRef}
        prevRef={prevRef}
        maxSlideCount={25}
      />
    </entity>
  );
}

export function addAgentToScene(world: HubsWorld) {
  const eid = renderAsEntity(world, AgentEntity());
  addComponent(world, Hidden, eid);
  const obj = world.eid2obj.get(eid)!;
  window.APP.scene!.object3D.add(obj);
  return eid;
}
