import { AElement } from "aframe";
import { Component, defineQuery, hasComponent, Query } from "bitecs";
import { Object3D } from "three";
import { HubsWorld } from "../app";
import { findAncestor, traverseSome } from "./three-utils";
import { EntityID } from "./networking-types";

export type ElOrEid = EntityID | AElement;

const queries = new Map<Component, Query>();
export function anyEntityWith(world: HubsWorld, component: Component) {
  if (!queries.has(component)) {
    queries.set(component, defineQuery([component]));
  }

  const eids = queries.get(component)!(world);
  return eids.length ? eids[0] : null;
}

export function hasAnyComponent(world: HubsWorld, components: Component[], eid: number) {
  for (let i = 0; i < components.length; i++) {
    if (hasComponent(world, components[i], eid)) return true;
  }
  return false;
}

export function findAncestorEntity(world: HubsWorld, eid: number, predicate: (eid: number) => boolean) {
  const obj = findAncestor(world.eid2obj.get(eid)!, (o: Object3D) => !!(o.eid && predicate(o.eid))) as Object3D | null;
  return obj && obj.eid!;
}

export function findAncestorWithComponent(world: HubsWorld, component: Component, eid: number) {
  return findAncestorEntity(world, eid, otherId => hasComponent(world, component, otherId));
}

export function findChildWithComponent(world: HubsWorld, component: Component, eid: number) {
  const obj = world.eid2obj.get(eid);
  if (obj) {
    let childEid;
    traverseSome(obj, (otherObj: Object3D) => {
      if (otherObj.eid && hasComponent(world, component, otherObj.eid)) {
        childEid = otherObj.eid;
        return false;
      } else {
        return true;
      }
    });
    return childEid;
  }
}
