import { Quaternion, Vector3 } from "three";
import { HubsWorld } from "../app";
import { defineQuery } from "bitecs";
import { AudioListenerTag } from "../bit-components";

const _position = new Vector3();
const _quaternion = new Quaternion();
const _scale = new Vector3();
const _orientation = new Vector3();

const audioListenerQuery = defineQuery([AudioListenerTag]);
export function audioListenerSystem(world: HubsWorld) {
  audioListenerQuery(world).forEach(eid => {
    const obj = APP.world.eid2obj.get(eid)!;
    const listener = APP.audioCtx.listener;

    const up = obj.up;

    const timeDelta = world.time.delta / 1000;

    obj.matrixWorld.decompose(_position, _quaternion, _scale);

    _orientation.set(0, 0, -1).applyQuaternion(_quaternion);

    if (listener.positionX) {
      // code path for Chrome (see #14393)
      const endTime = APP.audioCtx.currentTime + timeDelta;
      listener.positionX.linearRampToValueAtTime(_position.x, endTime);
      listener.positionY.linearRampToValueAtTime(_position.y, endTime);
      listener.positionZ.linearRampToValueAtTime(_position.z, endTime);
      listener.forwardX.linearRampToValueAtTime(_orientation.x, endTime);
      listener.forwardY.linearRampToValueAtTime(_orientation.y, endTime);
      listener.forwardZ.linearRampToValueAtTime(_orientation.z, endTime);
      listener.upX.linearRampToValueAtTime(up.x, endTime);
      listener.upY.linearRampToValueAtTime(up.y, endTime);
      listener.upZ.linearRampToValueAtTime(up.z, endTime);
    } else {
      // Although these methods are deprecated they are currently the only way to set the orientation and position in Firefox.
      listener.setPosition(_position.x, _position.y, _position.z);
      listener.setOrientation(_orientation.x, _orientation.y, _orientation.z, up.x, up.y, up.z);
    }
  });
}
