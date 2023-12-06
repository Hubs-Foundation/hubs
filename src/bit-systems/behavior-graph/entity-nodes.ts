import {
  EventEmitter,
  makeEventNodeDefinition,
  makeFlowNodeDefinition,
  makeFunctionNodeDefinition,
  makeInNOutFunctionDesc,
  NodeCategory,
  SocketsList,
  ValueType
} from "@oveddan-behave-graph/core";
import { addComponent, hasComponent, IComponent } from "bitecs";
import { Color, Euler, Material, Mesh, MeshStandardMaterial, Object3D, Quaternion, Texture, Vector3 } from "three";
import { Text } from "troika-three-text";
import { HubsWorld } from "../../app";
import * as bitComponents from "../../bit-components";
import {
  CursorRaycastable,
  CustomTags,
  EntityID,
  GLTFModel,
  RemoteHoverTarget,
  SingleActionButton
} from "../../bit-components";
import { inflateCustomTags } from "../../inflators/custom-tags";
import { findAncestorWithComponent, findChildWithComponent } from "../../utils/bit-utils";
import { ClientID } from "../../utils/networking-types";
import { definitionListToMap } from "./utils";
import { getComponentBindings } from "./bindings/bindings";
import { camelCase } from "../../inflators/model";
import { takeOwnership } from "../../utils/take-ownership";
import { hubIdFromUrl } from "../../utils/media-url-utils";
import { changeHub } from "../../change-hub";

type SocketTypeName =
  | "string"
  | "float"
  | "integer"
  | "material"
  | "boolean"
  | "entity"
  | "player"
  | "color"
  | "vec3"
  | "euler"
  | "texture";

type EntityEventState = {
  emitters: {
    onInteract: EventEmitter<EntityID>;
    onCollisionEnter: EventEmitter<EntityID>;
    onCollisionStay: EventEmitter<EntityID>;
    onCollisionExit: EventEmitter<EntityID>;
    onPlayerCollisionEnter: EventEmitter<ClientID>;
    onPlayerCollisionStay: EventEmitter<ClientID>;
    onPlayerCollisionExit: EventEmitter<ClientID>;
  };
  listenerCount: number;
  collidingEntities: Set<EntityID>;
};
export const entityEvents = new Map<EntityID, EntityEventState>();

type EntityEventData = {
  target?: EntityID;
  callback?: (target: EntityID) => void;
};
function makeEntityEventNode(
  event: keyof EntityEventState["emitters"],
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
    initialState: {} as EntityEventData,
    init: ({ write, commit, configuration }) => {
      const target = configuration["target"] as EntityID;
      if (!target) throw new Error(`hubs/${event} must have a target`);

      hackySetup && hackySetup(target);

      const callback = (data: any) => {
        if (!event.toLowerCase().includes("stay")) console.log(event, target, data);
        write(outputType, data);
        commit("flow");
      };

      if (!entityEvents.has(target)) {
        entityEvents.set(target, {
          emitters: {
            onInteract: new EventEmitter<EntityID>(),
            onCollisionEnter: new EventEmitter<EntityID>(),
            onCollisionStay: new EventEmitter<EntityID>(),
            onCollisionExit: new EventEmitter<EntityID>(),
            onPlayerCollisionEnter: new EventEmitter<ClientID>(),
            onPlayerCollisionStay: new EventEmitter<ClientID>(),
            onPlayerCollisionExit: new EventEmitter<ClientID>()
          },
          listenerCount: 0,
          collidingEntities: new Set<EntityID>()
        });
        console.log("Generating entity event state for", target, entityEvents.get(target));
      }

      const entityState = entityEvents.get(target)!;
      entityState.emitters[event].addListener(callback);
      entityState.listenerCount++;
      console.log("added listener for", target, entityState.listenerCount);

      return { target, callback };
    },
    dispose: ({ state: { callback, target } }) => {
      const entityState = entityEvents.get(target!)!;
      entityState.emitters[event].removeListener(callback as any);
      entityState.listenerCount--;
      if (entityState.listenerCount === 0) entityEvents.delete(target!);
      return {};
    }
  });
}

function makeObjectPropertyFlowNode<T extends keyof Object3D>(property: T, valueType: SocketTypeName) {
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
    triggered: ({ read, commit, graph }) => {
      const eid = read("entity") as EntityID;
      const obj = APP.world.eid2obj.get(eid);
      if (!obj) {
        console.error(`${typeName} could not find entity`, eid);
        return;
      }
      const value = read(property) as Object3D[T];
      const prop = obj[property]!;
      if (typeof prop === "object" && "copy" in prop) {
        prop.copy(value);
        if (["position", "rotation", "scale"].includes(property)) obj.matrixNeedsUpdate = true;
      } else {
        obj[property] = value;
      }

      if (property === "visible") {
        const world = graph.getDependency<HubsWorld>("world")!;
        const { set } = getComponentBindings("visible")!;
        set!(world, eid, { [property]: value });
      }

      commit("flow");
    }
  });
}

export type GLTFMaterial = MeshStandardMaterial;
export const EntityValue = {
  entity: new ValueType(
    "entity",
    () => 0,
    (value: EntityID) => value,
    (value: EntityID) => value,
    (start: EntityID, end: EntityID, t: number) => (t < 0.5 ? start : end)
  ),
  material: new ValueType(
    "material",
    () => null,
    (value: EntityID) => value,
    (value: EntityID) => value,
    (start: EntityID, end: EntityID, t: number) => (t < 0.5 ? start : end)
  ),
  texture: new ValueType(
    "texture",
    () => null,
    (value: Texture) => value,
    (value: Texture) => value,
    (start: Texture, end: Texture, t: number) => (t < 0.5 ? start : end)
  ),
  color: new ValueType(
    "color",
    () => new Color(),
    (value: Color | number[] | string) => {
      if (value instanceof Color) {
        return value;
      } else if (typeof value === "string") {
        return new Color().set(value);
      } else if (Array.isArray(value)) {
        return new Color().fromArray(value);
      }
    },
    (value: Color) => [value.r, value.g, value.b, 1.0],
    (start: Color, end: Color, t: number) => new Color().copy(start).lerp(end, t)
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
  //   makeEntityEventNode("onButtonClicked", "entity", "On Button Clicked"),
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
  makeFlowNodeDefinition({
    typeName: "hubs/misc/changehub",
    category: "Components" as any,
    label: "Change Hub",
    in: {
      flow: "flow",
      //   entity: "entity",
      url: "string"
    },
    out: { flow: "flow" },
    initialState: undefined,
    triggered: ({ read, commit, graph }) => {
      const src: string = read("url");
      const url = new URL(src);
      //   alert("cliced" + read("text"));

      const waypoint = url.hash && url.hash.substring(1);
      // move to new room without page load or entry flow
      const hubId = hubIdFromUrl(src);
      changeHub(hubId, true, waypoint);
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
  makeInNOutFunctionDesc({
    name: "hubs/entity/components/custom_tags/hasTag",
    label: "CustomTags: Has Tag?",
    category: "Components" as any,
    in: [{ entity: "entity" }, { tag: "string" }],
    out: "boolean",
    exec: (entity: EntityID, tag: string) => {
      return hasComponent(APP.world, CustomTags, entity) && CustomTags.tags.get(entity)!.includes(tag);
    }
  }),
  makeFlowNodeDefinition({
    typeName: "hubs/entity/components/custom_tags/addTag",
    category: "Components" as any,
    label: "CustomTags: Add Tag",
    in: {
      flow: "flow",
      entity: "entity",
      tag: "string"
    },
    out: { flow: "flow" },
    initialState: undefined,
    triggered: ({ read, commit, graph }) => {
      const world = graph.getDependency<HubsWorld>("world")!;
      const entity = read<EntityID>("entity");
      const tag = read<string>("tag");

      if (!hasComponent(world, CustomTags, entity)) {
        inflateCustomTags(world, entity);
      }

      const tags = CustomTags.tags.get(entity)!;
      if (!tags.includes(tag)) tags.push(tag);

      commit("flow");
    }
  }),
  makeFlowNodeDefinition({
    typeName: "hubs/entity/components/custom_tags/removeTag",
    category: "Components" as any,
    label: "CustomTags: Remove Tag",
    in: {
      flow: "flow",
      entity: "entity",
      tag: "string"
    },
    out: { flow: "flow" },
    initialState: undefined,
    triggered: ({ read, commit, graph }) => {
      const world = graph.getDependency<HubsWorld>("world")!;
      const entity = read<EntityID>("entity");
      const tag = read<string>("tag");

      if (!hasComponent(world, CustomTags, entity)) {
        console.warn(`CustomTags: Remove Tag, entity did not have tag ${tag}`, entity);
        return;
      }

      const tags = CustomTags.tags.get(entity)!;
      const idx = tags.indexOf(tag);
      if (idx === -1) {
        console.warn(`CustomTags: Remove Tag, entity did not have tag ${tag}`, entity);
      } else {
        tags.splice(idx, 1);
      }

      commit("flow");
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/entity/unwrapMedia",
    label: "Unwrap Media",
    category: "Entity" as any,
    in: [{ entity: "entity" }],
    out: "entity",
    exec: (entity: EntityID) => {
      const world = APP.world;
      const obj = world.eid2obj.get(entity);

      if (!obj) {
        console.error(`unwrapMedia: could not find entity`, entity);
        return;
      }

      // TODO shouldn't use name to check this and shouldn't be directly referencing child like this
      return obj.name === "Interactable Media" && hasComponent(world, GLTFModel, obj.children[0]?.eid!)
        ? obj.children[0].eid
        : entity;
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/material/get",
    label: "Get Material",
    category: "Materials" as any,
    in: [{ entity: "entity" }],
    out: "material",
    exec: (entity: EntityID) => {
      const world = APP.world;

      const { get } = getComponentBindings("object-material")!;
      return get!(world, entity);
    }
  }),
  makeFlowNodeDefinition({
    typeName: "hubs/material/set",
    category: "Materials" as any,
    label: "Set Material",
    in: {
      flow: "flow",
      entity: "entity",
      material: "material"
    },
    out: { flow: "flow" },
    initialState: undefined,
    triggered: ({ read, commit, graph }) => {
      const world = graph.getDependency<HubsWorld>("world")!;
      const entity = read<EntityID>("entity");
      const matEid = read<EntityID>("material");

      const { set } = getComponentBindings("object-material")!;
      set!(world, entity, matEid);

      commit("flow");
    }
  }),

  ...makeMaterialPropertyNodes("color", "Color", "Color", "color"),
  ...makeMaterialPropertyNodes("map", "Map", "Diffuse Map", "texture", "texture"),
  ...makeMaterialPropertyNodes("transparent", "Transparent", "Is Transparent", "boolean"),
  ...makeMaterialPropertyNodes("opacity", "Opacity", "Opacity", "float"),
  ...makeMaterialPropertyNodes("alphaMap", "AlphaMap", "Alpha Map", "texture", "texture"),
  ...makeMaterialPropertyNodes("toneMapped", "ToneMapped", "Is Tone Mapped", "boolean"),
  ...makeMaterialPropertyNodes("emissive", "Emissive", "Emissive Color", "color", "color"),
  ...makeMaterialPropertyNodes("emissiveMap", "EmissiveMap", "Emissive Map", "texture", "texture"),
  ...makeMaterialPropertyNodes("emissiveIntensity", "EmissiveIntensity", "Emissive Intensity", "float", "intensity"),
  ...makeMaterialPropertyNodes("roughness", "Roughness", "Roughness", "float"),
  ...makeMaterialPropertyNodes("roughnessMap", "RoughnessMap", "Roughness Map", "texture", "texture"),
  ...makeMaterialPropertyNodes("metalness", "Metalness", "Metalness", "float"),
  ...makeMaterialPropertyNodes("metalnessMap", "MetalnessMap", "Metalness Map", "texture", "texture"),
  ...makeMaterialPropertyNodes("lightMap", "LightMap", "Light Map", "texture", "texture"),
  ...makeMaterialPropertyNodes("lightMapIntensity", "LightMapIntensity", "Lightmap Intensity", "float", "intensity"),
  ...makeMaterialPropertyNodes("aoMap", "AOMap", "AO Map", "texture", "texture"),
  ...makeMaterialPropertyNodes("aoMapIntensity", "AOMapIntensity", "AO Map Intensity", "float", "intensity"),
  ...makeMaterialPropertyNodes("normalMap", "NormalMap", "Normal Map", "texture", "texture"),
  ...makeMaterialPropertyNodes("wireframe", "Wireframe", "Is Wireframe", "boolean"),
  ...makeMaterialPropertyNodes("flatShading", "FlatShading", "Is Flat Shaded", "boolean"),
  ...makeMaterialPropertyNodes("fog", "Fog", "Is Effected By Fog", "boolean"),
  ...makeMaterialPropertyNodes("depthWrite", "DepthWrite", "Depth Write", "boolean"),
  ...makeMaterialPropertyNodes("alphaTest", "alphaTest", "Alpha Cutoff", "float", "cutoff"),

  // TODO
  // this.normalMapType = source.normalMapType;
  // this.normalScale.copy( source.normalScale );

  makeObjectPropertyFlowNode("visible", "boolean"),
  makeObjectPropertyFlowNode("position", "vec3"),
  makeObjectPropertyFlowNode("rotation", "euler"),
  makeObjectPropertyFlowNode("scale", "vec3")
]);

type SettableMaterialProperties =
  | "opacity"
  | "color"
  | "emissive"
  | "transparent"
  | "toneMapped"
  | "flatShading"
  | "wireframe"
  | "fog"
  | "roughness"
  | "metalness"
  | "lightMapIntensity"
  | "aoMapIntensity"
  | "emissiveIntensity"
  | "map"
  | "lightMap"
  | "aoMap"
  | "emissiveMap"
  | "normalMap"
  | "roughnessMap"
  | "metalnessMap"
  | "alphaMap"
  | "depthWrite"
  | "alphaTest";

function makeMaterialPropertyNodes<T extends SettableMaterialProperties, S extends SocketTypeName>(
  property: T,
  nodeName: string,
  nodeLabel: string,
  socketType: S,
  socketName: string = property
) {
  return [
    makeInNOutFunctionDesc({
      name: `hubs/material/get${nodeName}`,
      label: `Get Material ${nodeLabel}`,
      category: "Materials" as any,
      in: [{ material: "material" }],
      out: socketType,
      exec: (matEid: EntityID) => {
        const { get } = getComponentBindings("material")!;
        const material = get!(APP.world, matEid);
        return (material as any)[property];
      }
    }),
    makeFlowNodeDefinition({
      typeName: `hubs/material/set${nodeName}`,
      category: "Materials" as any,
      label: `Set Material ${nodeLabel}`,
      in: {
        flow: "flow",
        material: "material",
        [socketName]: socketType
      },
      out: { flow: "flow" },
      initialState: undefined,
      triggered: ({ read, commit, graph }) => {
        const world = graph.getDependency<HubsWorld>("world")!;
        const matEid = read<EntityID>("material");
        const value = read(socketName) as any;
        // TODO Replace this by a take ownership checkbox in the set nodes
        takeOwnership(world, matEid);
        const { set } = getComponentBindings("material")!;
        set!(world, matEid, { [property]: value });
        commit("flow");
      }
    }),
    makeInNOutFunctionDesc({
      name: "entity/getEntityComponent",
      category: "Entity" as any,
      label: `Get Component`,
      in: [{ entity: "entity" }, { component: "string" }],
      out: [{ entity: "entity" }],
      exec: (entity: EntityID, component: string) => {
        const { component: componentDef } = getComponentBindings(component);
        const cmp = findChildWithComponent(APP.world, componentDef, entity);
        return { entity: cmp };
      }
    }),
    makeFlowNodeDefinition({
      typeName: "components/setComponentProperty",
      category: "Components" as any,
      label: "Set Components Property",
      configuration: {
        component: {
          valueType: "string"
        },
        property: {
          valueType: "string"
        }
      },
      in: configuration => {
        const propertyName = configuration.property || "string";
        const type = configuration.type || "string";

        const sockets: SocketsList = [
          {
            key: "flow",
            valueType: "flow"
          },
          {
            key: "entity",
            valueType: "entity"
          },
          {
            key: type,
            valueType: type,
            label: propertyName
          }
        ];

        return sockets;
      },
      initialState: undefined,
      out: { flow: "flow" },
      triggered: ({ read, commit, configuration, graph }) => {
        const world = graph.getDependency("world") as HubsWorld;

        const componentName = camelCase(configuration.component as string);
        const propertyName = configuration.property as string;
        const type = configuration.type as string;

        const entity = read("entity") as EntityID;

        const { set } = getComponentBindings(componentName);
        if (set) {
          set(world, entity, {
            [propertyName]: read(type)
          });
        } else {
          console.error(`Set not supported for ${componentName}.${propertyName}`);
        }

        commit("flow");
      }
    }),
    makeFunctionNodeDefinition({
      typeName: "components/getComponentProperty",
      category: "Components" as any,
      label: "Get Components Property",
      configuration: {
        prop_name: {
          valueType: "string"
        },
        prop_type: {
          valueType: "string"
        }
      },
      in: configuration => {
        const sockets: SocketsList = [
          {
            key: "entity",
            valueType: "entity"
          }
        ];

        return sockets;
      },
      out: configuration => {
        const propertyName = configuration.property || "string";
        const type = configuration.type || "string";

        const result: SocketsList = [
          {
            key: type,
            valueType: type,
            label: propertyName
          }
        ];

        return result;
      },
      exec: ({ read, write, configuration, graph }) => {
        const world = graph.getDependency("world") as HubsWorld;

        const componentName = camelCase(configuration.component as string);
        const propertyName = configuration.property as string;
        const type = configuration.type as string;

        const entity = read("entity") as EntityID;

        const { get } = getComponentBindings(componentName);
        if (get) {
          const props = get(world, entity);
          write(type, props[propertyName]);
        } else {
          console.error(`Get not supported for ${componentName}.${propertyName}`);
        }
      }
    })
  ];
}
