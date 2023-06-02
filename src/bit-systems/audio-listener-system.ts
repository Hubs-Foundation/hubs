import { Quaternion, Vector3 } from "three";
import { HubsWorld } from "../app";
import { defineQuery } from "bitecs";
import { AudioListenerTag } from "../bit-components";

const _position = new Vector3();
const _quaternion = new Quaternion();
const _scale = new Vector3();
const _orientation = new Vector3();
const lastPosition = new Vector3();
const lastOrientation = new Vector3();
const lastUp = new Vector3();

const audioListenerQuery = defineQuery([AudioListenerTag]);
export function audioListenerSystem(world: HubsWorld) {
  audioListenerQuery(world).forEach(eid => {
    const obj = APP.world.eid2obj.get(eid)!;
    const listener = APP.audioCtx.listener;

    const up = obj.up;

    obj.matrixWorld.decompose(_position, _quaternion, _scale);

    _orientation.set(0, 0, -1).applyQuaternion(_quaternion);

    const positionUpdated = !lastPosition.equals(_position);
    const orientationUpdated = !lastOrientation.equals(_orientation);
    const lastUpUpdated = !lastUp.equals(up);
    if (positionUpdated || orientationUpdated || lastUpUpdated) {
      if (listener.positionX) {
        // code path for Chrome (see #14393)
        listener.positionX.setValueAtTime(_position.x, 0);
        listener.positionY.setValueAtTime(_position.y, 0);
        listener.positionZ.setValueAtTime(_position.z, 0);
        listener.forwardX.setValueAtTime(_orientation.x, 0);
        listener.forwardY.setValueAtTime(_orientation.y, 0);
        listener.forwardZ.setValueAtTime(_orientation.z, 0);
        listener.upX.setValueAtTime(up.x, 0);
        listener.upY.setValueAtTime(up.y, 0);
        listener.upZ.setValueAtTime(up.z, 0);
      } else {
        // Although these methods are deprecated they are currently the only way to set the orientation and position in Firefox.
        listener.setPosition(_position.x, _position.y, _position.z);
        listener.setOrientation(_orientation.x, _orientation.y, _orientation.z, up.x, up.y, up.z);
      }
    }
    lastPosition.copy(_position);
    lastOrientation.copy(_orientation);
    lastUp.copy(up);
  });
}
