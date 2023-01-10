import { defineQuery, hasComponent } from "bitecs";
import { findAncestor } from "./three-utils";

const queries = new Map();
export function anyEntityWith(world, component) {
  if (!queries.has(component)) {
    queries.set(component, defineQuery([component]));
  }

  const eids = queries.get(component)(world);
  return eids.length && eids[0];
}

export function hasAnyComponent(world, components, eid) {
  for (let i = 0; i < components.length; i++) {
    if (hasComponent(world, components[i], eid)) return true;
  }
  return false;
}

export function findAncestorEntity(world, eid, predicate) {
  const obj = findAncestor(world.eid2obj.get(eid), o => o.eid && predicate(o.eid));
  return obj && obj.eid;
}
