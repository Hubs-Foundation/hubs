import { AElement } from "aframe";
import { Component, defineQuery, hasComponent, Query } from "bitecs";
import { Object3D } from "three";
import { HubsWorld } from "../app";
import { findAncestor, findAncestors, traverseSome } from "./three-utils";
import { EntityID } from "./networking-types";
import qsTruthy from "./qs_truthy";

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

export function findAncestorEntity(
  world: HubsWorld,
  eid: number,
  predicate: (eid: number, world: HubsWorld) => boolean
) {
  const obj = findAncestor(
    world.eid2obj.get(eid)!,
    (o: Object3D) => !!(o.eid && predicate(o.eid, world))
  ) as Object3D | null;
  return obj && obj.eid!;
}

export function findAncestorEntities(world: HubsWorld, eid: number, predicate: (eid: number) => boolean): EntityID[] {
  const objs = findAncestors(world.eid2obj.get(eid)!, (o: Object3D) => !!(o.eid && predicate(o.eid))) as Object3D[];
  return objs.filter(obj => obj.eid!).map(obj => obj.eid) as EntityID[];
}

export function findAncestorWithComponent(world: HubsWorld, component: Component, eid: number) {
  return findAncestorEntity(world, eid, (otherId, world) => hasComponent(world, component, otherId));
}

export function findAncestorsWithComponent(world: HubsWorld, component: Component, eid: number): EntityID[] {
  return findAncestorEntities(world, eid, otherId => hasComponent(world, component, otherId));
}

export function findAncestorWithComponents(world: HubsWorld, components: Array<Component>, eid: number) {
  return findAncestorEntity(world, eid, otherId =>
    components.every(component => hasComponent(world, component, otherId))
  );
}

export function findAncestorWithAnyComponent(world: HubsWorld, components: Array<Component>, eid: number) {
  return findAncestorEntity(world, eid, otherId => hasAnyComponent(world, components, otherId));
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

const forceNewLoader = qsTruthy("newLoader");
export function shouldUseNewLoader() {
  return forceNewLoader || APP.hub?.user_data?.hubs_use_bitecs_based_client;
}
