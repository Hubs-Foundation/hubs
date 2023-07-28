/** @jsx createElementEntity */
import { createElementEntity, renderAsEntity, createRef } from "../utils/jsx-entity";
import { preload } from "../utils/preload";
import { loadModel } from "../components/gltf-model-plus";
import agentModelSrc from "../assets/models/cute_agent.glb";
import { HubsWorld } from "../app";
import { MediaLoaderParams } from "../inflators/media-loader";
import nametagSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { AgentPanel } from "./agent-panel";
import { addComponent } from "bitecs";
import { Hidden } from "../bit-components";
import { COLLISION_LAYERS } from "../constants";

preload(loadModel(agentModelSrc, null, true));
const panelTexture = textureLoader.load(nametagSrc);
const slideRefs = [];

// for (let i = 0; i < 25; i++) {
//   const ref = createRef();
//   slideRefs.push(ref);
// }

const agentMediaParams: MediaLoaderParams = {
  src: agentModelSrc,
  recenter: true,
  resize: true,
  animateLoad: true,
  isObjectMenuTarget: true
};

export function AgentEntity() {
  const language = 0;
  const agentRef = createRef();
  const panelRef = createRef();
  const modelRef = createRef();
  const micRef = createRef();
  const snapRef = createRef();
  const nextRef = createRef();
  const prevRef = createRef();
  const text = ["", ""];
  // FromatNewText(greetingPhrases[getRandomInt(greetingPhrases.length)]);

  return (
    <entity
      name="Agent"
      agent={{ language, panelRef, modelRef, micRef, snapRef, nextRef, prevRef }}
      scale={[1, 1, 1]}
      ref={agentRef}
      lookatuser
    >
      <entity
        lookatuser
        name="agentObject"
        mediaLoader={agentMediaParams}
        ref={modelRef}
        scale={[1, 1, 1]}
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
