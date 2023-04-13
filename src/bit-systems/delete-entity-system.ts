import { addComponent, defineQuery, exitQuery, hasComponent, removeEntity } from "bitecs";
import { Vector3 } from "three";
import { HubsWorld } from "../app";
import { Deletable, Deleting, HoveredRemoteLeft, HoveredRemoteRight } from "../bit-components";
import { paths } from "../systems/userinput/paths";
import { animate } from "../utils/animate";
import { findAncestorEntity } from "../utils/bit-utils";
import { coroutine } from "../utils/coroutine";
import { easeOutQuadratic } from "../utils/easing";
import { deleteEntityState, hasSavedEntityState } from "../utils/entity-state-utils";

// TODO Move to coroutine.ts when it exists
// TODO Figure out the appropriate type and use it everywhere
export type Coroutine = Generator<Promise<void>, void, unknown>;

const END_SCALE = new Vector3().setScalar(0.001);
function* animateThenRemoveEntity(world: HubsWorld, eid: number): Coroutine {
  if (hasSavedEntityState(world, eid)) {
    deleteEntityState(APP.hubChannel!, world, eid);
  }
  addComponent(world, Deleting, eid);
  const obj = world.eid2obj.get(eid)!;
  yield* animate({
    properties: [[obj.scale.clone(), END_SCALE]],
    durationMS: 400,
    easing: easeOutQuadratic,
    fn: ([scale]: [Vector3]) => {
      obj.scale.copy(scale);
      obj.matrixNeedsUpdate = true;
    }
  });
  removeEntity(world, eid);
}

const deletableQuery = defineQuery([Deletable]);
const deletableExitQuery = exitQuery(deletableQuery);
const hoveredRightQuery = defineQuery([HoveredRemoteRight]);
const hoveredLeftQuery = defineQuery([HoveredRemoteLeft]);
const coroutines = new Map();

export function deleteTheDeletableAncestor(world: HubsWorld, eid: number) {
  const ancestor = findAncestorEntity(world, eid, (e: number) => hasComponent(world, Deletable, e));
  if (ancestor && !coroutines.has(ancestor)) {
    coroutines.set(ancestor, coroutine(animateThenRemoveEntity(world, ancestor)));
  }
}

export function deleteEntitySystem(world: HubsWorld, userinput: any) {
  deletableExitQuery(world).forEach(function (eid) {
    coroutines.delete(eid);
  });
  if (userinput.get(paths.actions.cursor.right.deleteEntity)) {
    hoveredRightQuery(world).forEach(eid => deleteTheDeletableAncestor(world, eid));
  }
  if (userinput.get(paths.actions.cursor.left.deleteEntity)) {
    hoveredLeftQuery(world).forEach(eid => deleteTheDeletableAncestor(world, eid));
  }
  coroutines.forEach(c => c());
}
