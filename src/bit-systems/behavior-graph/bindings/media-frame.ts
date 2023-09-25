import { HubsWorld } from "../../../app";
import { EntityID, MediaFrame, NetworkedMediaFrame } from "../../../bit-components";
import { MEDIA_FRAME_FLAGS, MediaTypes } from "../../../inflators/media-frame";

export function getMediaFrame(world: HubsWorld, eid: EntityID) {
  return {
    bounds: { x: MediaFrame.bounds[eid][0], y: MediaFrame.bounds[eid][1], z: MediaFrame.bounds[eid][2] },
    mediaType: APP.getString(MediaFrame.mediaType[eid]),
    snapToCenter: MediaFrame.flags[eid] & MEDIA_FRAME_FLAGS.SNAP_TO_CENTER ? true : false,
    active: MediaFrame.flags[eid] & MEDIA_FRAME_FLAGS.ACTIVE ? true : false,
    locked: MediaFrame.flags[eid] & MEDIA_FRAME_FLAGS.LOCKED ? true : false
  };
}

type MediaTypeKey = keyof typeof MediaTypes;

export function setMediaFrame(world: HubsWorld, eid: EntityID, componentProps: any) {
  componentProps = Object.assign({}, getMediaFrame(world, eid), componentProps);

  if (componentProps.snapToCenter) {
    NetworkedMediaFrame.flags[eid] |= MEDIA_FRAME_FLAGS.SNAP_TO_CENTER;
  } else {
    NetworkedMediaFrame.flags[eid] &= ~MEDIA_FRAME_FLAGS.SNAP_TO_CENTER;
  }
  if (componentProps.active) {
    NetworkedMediaFrame.flags[eid] |= MEDIA_FRAME_FLAGS.ACTIVE;
  } else {
    NetworkedMediaFrame.flags[eid] &= ~MEDIA_FRAME_FLAGS.ACTIVE;
  }
  if (componentProps.locked) {
    NetworkedMediaFrame.flags[eid] |= MEDIA_FRAME_FLAGS.LOCKED;
  } else {
    NetworkedMediaFrame.flags[eid] &= ~MEDIA_FRAME_FLAGS.LOCKED;
  }
  NetworkedMediaFrame.mediaType[eid] = MediaTypes[componentProps.mediaType as MediaTypeKey];
  // TODO Add networked support for bounds
}
