import { defineQuery, enterQuery, entityExists, hasComponent, removeComponent } from "bitecs";
import { HubsWorld } from "../app";
import { CursorRaycastable, Pen, PenActive, PenUpdated, SceneRoot } from "../bit-components";
import { PenComponent, PenToolsSystem } from "aframe";
import { Object3D } from "three";
import { EntityID } from "../utils/networking-types";
import { anyEntityWith } from "../utils/bit-utils";

function addTarget(world: HubsWorld, target: EntityID, targets: Object3D[]) {
  const object = APP.world.eid2obj.get(target)!;
  if (!hasComponent(world, Pen, target) && !targets.includes(object)) {
    targets.push(object);
  }
}

const raycastableQuery = defineQuery([CursorRaycastable]);
const sceneQuery = defineQuery([SceneRoot]);
const raycastableEnterQuery = enterQuery(raycastableQuery);
const penUpdateQuery = defineQuery([PenUpdated]);
const penUpdateEnterQuery = enterQuery(penUpdateQuery);
export function bitPenCompatSystem(world: HubsWorld, penToolsSystem: PenToolsSystem) {
  const pen = penToolsSystem.myPen?.components["pen"] as PenComponent;
  if (pen) {
    removeComponent(world, PenUpdated, pen.el.eid);
  }
  if (anyEntityWith(world, PenActive)) {
    penUpdateEnterQuery(world).forEach(eid => {
      raycastableQuery(APP.world).forEach(eid => {
        addTarget(world, eid, pen.targets);
      });
      sceneQuery(world).forEach(eid => {
        addTarget(world, eid, pen.targets);
      });
    });
    raycastableEnterQuery(world).forEach(eid => {
      addTarget(world, eid, pen.targets);
    });
  }
}
