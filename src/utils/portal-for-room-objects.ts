import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Networked, RoomPortal } from "../bit-components";
import { EntityID } from "./networking-types";

export default function portalForRoomObjects(world: HubsWorld, eid: EntityID) {
  // Construct a GLTF node from this entity
  const object3D = world.eid2obj.get(eid)!;
  const networkId = APP.getString(Networked.id[eid])!;

  const gltfComponents = {};
  // TODO: Move to MOZ_hubs_components and include version number. Requires migration of existing room objects.
  // Please do this before making a breaking change to the data stored here.
  const gltfNode = { name: networkId, extensions: { HUBS_components: gltfComponents } };

  // Adapted from three.js GLTFExporter
  const equalArray = (x: any, y: any) => x.length === y.length && x.every((v: any, i: any) => v === y[i]);
  const rotation = object3D.quaternion.toArray();
  const position = object3D.position.toArray();
  const scale = object3D.scale.toArray();

  if (!equalArray(rotation, [0, 0, 0, 1])) (gltfNode as any).rotation = rotation;
  if (!equalArray(position, [0, 0, 0])) (gltfNode as any).translation = position;
  if (!equalArray(scale, [1, 1, 1])) (gltfNode as any).scale = scale;

  if (object3D.eid && hasComponent(APP.world, RoomPortal, object3D.eid)) {
    (gltfComponents as any).roomPortal = { src: APP.getString(RoomPortal.src[object3D.eid]) };
  }

  (gltfComponents as any).pinnable = { pinned: true };

  return gltfNode;
}
