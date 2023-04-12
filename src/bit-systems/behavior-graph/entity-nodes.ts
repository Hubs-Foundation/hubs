import {
  EventEmitter,
  makeEventNodeDefinition,
  makeFlowNodeDefinition,
  makeInNOutFunctionDesc,
  NodeCategory,
  ValueType
} from "@oveddan-behave-graph/core";
import { addComponent, hasComponent, IComponent } from "bitecs";
import { Box3, Box3Helper, Euler, Object3D, Quaternion, Vector3 } from "three";
import { CursorRaycastable, EntityID, RemoteHoverTarget, SingleActionButton } from "../../bit-components";
import * as bitComponents from "../../bit-components";
import { COLLISION_LAYERS } from "../../constants";
import { Fit, inflatePhysicsShape, Shape } from "../../inflators/physics-shape";
import { definitionListToMap } from "./utils";
import { findAncestorWithComponent } from "../../utils/bit-utils";
import { inflateRigidBody, Type } from "../../inflators/rigid-body";
import { ClientID } from "../../utils/networking-types";
import { HubsWorld } from "../../app";
import { Text } from "troika-three-text";

export const entityEvents = {
  onInteract: new Map<EntityID, EventEmitter<EntityID>>(),
  onCollisionEnter: new Map<EntityID, EventEmitter<EntityID>>(),
  onCollisionStay: new Map<EntityID, EventEmitter<EntityID>>(),
  onCollisionExit: new Map<EntityID, EventEmitter<EntityID>>(),
  onPlayerCollisionEnter: new Map<EntityID, EventEmitter<ClientID>>(),
  onPlayerCollisionStay: new Map<EntityID, EventEmitter<ClientID>>(),
  onPlayerCollisionExit: new Map<EntityID, EventEmitter<ClientID>>()
};
type EntityEventState = {
  target?: EntityID;
  callback?: (target: EntityID) => void;
};
function makeEntityEventNode(
  event: keyof typeof entityEvents,
  outputType: "player" | "entity",
  label: string,
  hackySetup?: (target: EntityID) => void
) {
  return makeEventNodeDefinition({
    typeName: `hubs/${event}`,
    category: NodeCategory.Event,
    label,
    in: {},
    out: {
      flow: "flow",
      [outputType]: outputType
    },
    configuration: {
      target: { valueType: "entity" }
    },
    initialState: {} as EntityEventState,
    init: ({ write, commit, configuration }) => {
      const target = configuration["target"] as EntityID;
      if (!target) throw new Error(`hubs/${event} must have a target`);
      hackySetup && hackySetup(target);
      const callback = (data: any) => {
        if (!event.toLowerCase().includes("stay")) console.log(event, data);
        write(outputType, data);
        commit("flow");
      };
      const emitter = entityEvents[event].get(target) || new EventEmitter();
      emitter.addListener(callback);
      entityEvents[event].set(target, emitter as any);
      return { target, callback };
    },
    dispose: ({ state: { callback, target } }) => {
      const emitter = entityEvents[event].get(target!)!;
      emitter.removeListener(callback as any);
      if (!emitter.listenerCount) entityEvents[event].delete(target!);
      return {};
    }
  });
}

function makeObjectPropertyFlowNode<T extends keyof Object3D>(property: T, valueType: string) {
  const typeName = `hubs/entity/set/${property}`;
  return makeFlowNodeDefinition({
    typeName,
    category: "Entity" as any,
    label: `Set ${property}`,
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "entity", valueType: "entity" },
      { key: property, valueType }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit }) => {
      const eid = read("entity") as EntityID;
      const obj = APP.world.eid2obj.get(eid);
      if (!obj) {
        console.error(`${typeName} could not find entity`, eid);
        return;
      }
      const value = read(property) as Object3D[T];
      const prop = obj[property];
      if (typeof prop === "object" && "copy" in prop) {
        prop.copy(value);
        if (["position", "rotation", "scale"].includes(property)) obj.matrixNeedsUpdate = true;
      } else {
        obj[property] = value;
      }
      commit("flow");
    }
  });
}

export const EntityValue = {
  entity: new ValueType(
    "entity",
    () => 0,
    (value: EntityID) => value,
    (value: EntityID) => value,
    (start: EntityID, end: EntityID, t: number) => (t < 0.5 ? start : end)
  )
};

export const EntityNodes = definitionListToMap([
  makeEntityEventNode("onInteract", "entity", "On Interact", function (target) {
    // TODO should be added in blender
    addComponent(APP.world, SingleActionButton, target);
    addComponent(APP.world, CursorRaycastable, target);
    addComponent(APP.world, RemoteHoverTarget, target);
  }),
  makeEntityEventNode("onCollisionEnter", "entity", "On Collision Enter"),
  makeEntityEventNode("onCollisionStay", "entity", "On Collision Stay"),
  makeEntityEventNode("onCollisionExit", "entity", "On Collision Exit"),
  makeEntityEventNode("onPlayerCollisionEnter", "player", "On Player Collision Enter"),
  makeEntityEventNode("onPlayerCollisionStay", "player", "On Player Collision Stay"),
  makeEntityEventNode("onPlayerCollisionExit", "player", "On Player Collision Exit"),
  makeInNOutFunctionDesc({
    name: "hubs/entity/toString",
    label: "Entity toString",
    category: "Entity" as any,
    in: [{ entity: "entity" }],
    out: "string",
    exec: (entity: EntityID) => {
      const obj = APP.world.eid2obj.get(entity)!;
      return `Entity ${obj.name}`;
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/entity/hasComponent",
    label: "Entity Has Component",
    category: "Entity" as any,
    in: [{ entity: "entity" }, { name: "string" }, { includeAncestors: "boolean" }],
    out: "boolean",
    exec: (entity: EntityID, name: string, includeAncestors: boolean) => {
      const Component = (bitComponents as any)[name] as IComponent | undefined;
      if (!Component) {
        console.error(`Invalid component name ${name} in hubs/entity/hasComponent node`);
        return false;
      }
      if (includeAncestors) {
        return !!findAncestorWithComponent(APP.world, Component, entity);
      } else {
        return hasComponent(APP.world, Component, entity);
      }
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/entity/properties",
    label: "Get Entity Properties",
    category: "Entity" as any,
    in: [{ entity: "entity" }],
    out: [
      { entity: "entity" },
      { name: "string" },
      { visible: "boolean" },
      { position: "vec3" },
      { rotation: "euler" },
      { scale: "vec3" }
    ],
    exec: (eid: EntityID) => {
      const obj = APP.world.eid2obj.get(eid)!;
      return {
        entity: eid,
        name: obj.name,
        visible: obj.visible,
        // TODO this is largely so that variables work since they are set using =. We can add support for .copy()-able things
        position: obj.position.clone(),
        rotation: obj.rotation.clone(),
        scale: obj.scale.clone()
      };
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/entity/equal",
    label: "=",
    category: "Entity" as any,
    in: ["entity", "entity"],
    out: [{ result: "boolean" }],
    exec: (a: EntityID, b: EntityID) => {
      return a === b;
    }
  }),
  makeFlowNodeDefinition({
    typeName: "hubs/components/text/setText",
    category: "Components" as any,
    label: "Text: Set Text",
    in: {
      flow: "flow",
      entity: "entity",
      text: "string"
    },
    out: { flow: "flow" },
    initialState: undefined,
    triggered: ({ read, commit, graph }) => {
      const world = graph.getDependency<HubsWorld>("world")!;
      const eid = read<EntityID>("entity");
      const obj = world.eid2obj.get(eid);
      if (!obj || !(obj as Text).isTroikaText) {
        console.error(`Text: Set Text, could not find entity with text`, eid);
        return;
      }
      const text = obj as Text;
      text.text = read("text");
      commit("flow");
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/entity/localToWorld/vec3",
    label: "Local to World",
    category: "Vec3 Math" as any,
    in: [{ position: "vec3" }, { entity: "entity" }],
    out: "vec3",
    exec: (position: Vector3, entity: EntityID) => {
      const obj = APP.world.eid2obj.get(entity);
      if (!obj || !(obj as Text).isTroikaText) {
        console.error(`vec3 localToWorld, could not find entity`, entity);
        return position.clone();
      }
      obj.updateMatrices();
      return obj.localToWorld(position);
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/entity/localToWorld/euler",
    label: "Local to World",
    category: "Euler Math" as any,
    in: [{ rotation: "euler" }, { entity: "entity" }],
    out: "euler",
    exec: (rotation: Euler, entity: EntityID) => {
      const obj = APP.world.eid2obj.get(entity);
      if (!obj || !(obj as Text).isTroikaText) {
        console.error(`euler localToWorld, could not find entity`, entity);
        return rotation.clone();
      }
      obj.updateMatrices();
      const q = obj.getWorldQuaternion(new Quaternion());
      // TODO allocations
      return new Euler().setFromQuaternion(new Quaternion().setFromEuler(rotation).multiply(q));
    }
  }),
  makeObjectPropertyFlowNode("visible", "boolean"),
  makeObjectPropertyFlowNode("position", "vec3"),
  makeObjectPropertyFlowNode("rotation", "euler"),
  makeObjectPropertyFlowNode("scale", "vec3")
]);
