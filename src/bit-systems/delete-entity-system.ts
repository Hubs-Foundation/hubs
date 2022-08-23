import { defineQuery, exitQuery, hasComponent, removeEntity } from "bitecs";
import { HubsWorld } from "../app";
import { Deletable, HoveredRemoteLeft, HoveredRemoteRight } from "../bit-components";
import { paths } from "../systems/userinput/paths";
import { sleep } from "../utils/async-utils";
import { findAncestorEntity } from "../utils/bit-utils";
import { coroutine } from "../utils/coroutine";

function* deleteEntity(world: HubsWorld, eid: number) {
  yield sleep(1000);
  removeEntity(world, eid);
}

const deletableQuery = defineQuery([Deletable]);
const deletableExitQuery = exitQuery(deletableQuery);
const hoveredRightQuery = defineQuery([HoveredRemoteRight]);
const hoveredLeftQuery = defineQuery([HoveredRemoteLeft]);
const coroutines = new Map();

function deleteTheDeletableAncestor(world: HubsWorld, eid: number) {
  const ancestor = findAncestorEntity(world, eid, (e: number) => hasComponent(world, Deletable, e));
  if (ancestor && !coroutines.has(ancestor)) {
    coroutines.set(ancestor, coroutine(deleteEntity(world, ancestor)));
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
