/** @jsx createElementEntity */
import agentModelSrc from "../assets/models/voxy_emitted.glb";
import { createElementEntity, renderAsEntity, createRef } from "../utils/jsx-entity";
import { preload } from "../utils/preload";
import { cloneModelFromCache, loadModel } from "../components/gltf-model-plus";
import { HubsWorld } from "../app";
import { AgentPanel, SimplePanel } from "./agent-panel";
import { COLLISION_LAYERS } from "../constants";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { Type } from "../inflators/rigid-body";

preload(loadModel(agentModelSrc, null, true));

export function AgentEntity() {
  const agentRef = createRef();
  const panelRef = createRef();
  const micRef = createRef();
  const snapRef = createRef();
  const nextRef = createRef();
  const prevRef = createRef();
  const textRef = createRef();
  const navRef = createRef();

  return (
    <entity followFov>
      <entity
        name="Agent"
        agent={{ panelRef, textRef, micRef, snapRef, nextRef, prevRef, navRef }}
        ref={agentRef}
        model={{ model: cloneModelFromCache(agentModelSrc).scene }}
        visible={false}
        lookatuser
        cursorRaycastable
        remoteHoverTarget
        handCollisionTarget
        offersRemoteConstraint
        offersHandConstraint
        makeKinematicOnRelease
        holdable
        grabbable={{ cursor: true, hand: true }}
        destroyAtExtremeDistance
        floatyObject={{
          flags: FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE,
          releaseGravity: 0
        }}
        networkedFloatyObject={{
          flags: FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE
        }}
        rigidbody={{
          type: Type.KINEMATIC,
          collisionGroup: COLLISION_LAYERS.INTERACTABLES,
          collisionMask: COLLISION_LAYERS.HANDS
        }}
      >
        <SimplePanel panelRef={panelRef} textRef={textRef} listenRef={micRef} navRef={navRef} />
      </entity>
    </entity>
  );
}

export function addAgentToScene(world: HubsWorld) {
  const eid = renderAsEntity(world, AgentEntity());
  const obj = world.eid2obj.get(eid)!;
  world.scene.add(obj);
  return eid;
}
