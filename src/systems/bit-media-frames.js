import { addObject3DComponent, MediaFrame, Held, Rigidbody } from "../utils/jsx-entity";
import { defineComponent, defineQuery } from "bitecs";
import { MediaType } from "../utils/media-utils";

const mediaFramesQuery = defineQuery([MediaFrame]);
const heldQuery = defineQuery([Held]);

function heldMaskFor(world, eid) {
  const obj = world.eid2obj.get(eid);
  let heldMask = 0;
  heldMask |= obj.el.components["gltf-model-plus"] && MediaType.MODEL;
  heldMask |= obj.el.components["media-video"] && MediaType.VIDEO;
  heldMask |= obj.el.components["media-image"] && MediaType.IMAGE;
  heldMask |= obj.el.components["media-pdf"] && MediaType.PDF;
  return heldMask;
}

export function mediaFramesSystem(world) {
  const heldEids = heldQuery(world);
  let heldMask = 0;
  for (let i = 0; i < heldEids.length; i++) {
    const eid = heldEids[i];
    heldMask |= heldMaskFor(world, eid);
  }

  const mediaFrames = mediaFramesQuery(world);
  for (let i = 0; i < mediaFrames.length; i++) {
    const eid = mediaFrames[i];
    const obj = world.eid2obj.get(eid);
    obj.visible = !!(MediaFrame.mediaType[eid] & heldMask);
  }

  const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
  for (let i = 0; i < mediaFrames.length; i++) {
    const eid = mediaFrames[i];
    const obj = world.eid2obj.get(eid);
    const collisions = physicsSystem.getCollisions(Rigidbody.bodyId[eid]);

    for (let i = 0; i < collisions.length; i++) {
      const bodyData = physicsSystem.bodyUuidToData.get(collisions[i]);
      const mediaObjectEl = bodyData && bodyData.object3D && bodyData.object3D.el;
      if (MediaFrame.mediaType[eid] & heldMaskFor(world, bodyData.object3D.eid)) {
        console.log("colliding with", bodyData.object3D.eid);
      }
    }
  }
}
