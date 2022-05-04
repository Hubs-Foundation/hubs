import { createElementEntity, createRef, Networked, Spin } from "../utils/jsx-entity";
/** @jsx createElementEntity */

import { renderAsAframeEntity } from "../utils/jsx-entity";
import { defineQuery, Changed } from "bitecs";

import * as bitecs from "bitecs";
window.$B = bitecs;

function ab2str(buffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function str2ab(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// const serializer = defineSerializer([Changed(Spin)]);
// const deserializer = defineDeserializer([Changed(Spin)]);

function InteractableCube() {
  return (
    <entity
      spin={{ x: 0, y: 90 * THREE.Math.DEG2RAD, z: 0 }}
      scale={[1, 1, 0.5]}
      cursor-raycastable
      remote-hover-target
      offers-remote-constraint
      holdable
      rigidbody
    >
      <THREE.Mesh geometry={new THREE.BoxBufferGeometry()} material={new THREE.MeshStandardMaterial()} />
    </entity>
  );
}

const changedSpinQuery = defineQuery([Changed(Spin)]);
window.cs = changedSpinQuery;

export const cubeSchema = {
  template: "#interactable-cube-media",
  addEntity: function() {
    return renderAsAframeEntity(
      <a-entity>
        <InteractableCube />
      </a-entity>,
      APP.world
    );
  },
  serialize: function(el, isFullSync) {
    const eid = el.object3D.children[0].eid;
    const obj = APP.world.eid2obj.get(eid);

    const spinChanged = changedSpinQuery(APP.world).includes(eid);
    // TODO position diff
    if (!(isFullSync || spinChanged)) return null;

    const data = [obj.position.toArray(), Spin.x[eid], Spin.y[eid], Spin.z[eid]];
    console.log("sending data", eid, data);

    return data;
  },
  deserialize: function(el, data) {
    const eid = el.object3D.children[0].eid;
    const obj = APP.world.eid2obj.get(eid);
    obj.position.fromArray(data[0]);
    Spin.x[eid] = data[1];
    Spin.y[eid] = data[2];
    Spin.z[eid] = data[3];
  },
  components: []
};

export default {
  name: "#interactable-cube-media",
  addEntity: function(world, rootEid) {
    const obj = renderAsAframeEntity(<InteractableCube />, world, rootEid);
    return obj.eid;
  },
  serialize(world, eid) {
    // const data = serializer(entities);
    // const str = ab2str(data);
    // if (str) console.log("serialize", entities, data, str, str2ab(str));
    // return str || null;
    //
    const obj = world.eid2obj.get(eid);
    const data = [obj.position.toArray(), Spin.x[eid], Spin.y[eid], Spin.z[eid]];
    console.log("sending data", eid, data);
    return data;
  },

  deserialize(world, eid, data) {
    // const data = str2ab(str);
    // console.log("got data", data);
    // const ents = deserializer(APP.world, data, DESERIALIZE_MODE.MAP);
    // console.log(ents);
    // return ents;
    const obj = world.eid2obj.get(eid);
    obj.position.fromArray(data[0]);
    Spin.x[eid] = data[1];
    Spin.y[eid] = data[2];
    Spin.z[eid] = data[3];
  }
};